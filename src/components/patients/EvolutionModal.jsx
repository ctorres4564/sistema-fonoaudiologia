import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import InputField from '../common/InputField'
import { createEvolution, removeEvolution, subscribeEvolutions, updatePatient } from '../../services/patientService'
import { getAnamnesis, saveAnamnesis } from '../../services/anamnesisService'
import { askGemini } from '../../services/geminiService'
import { sanitizeAiPlainText } from '../../utils/markdownSanitizer'

const initialValues = {
  date: new Date().toISOString().split('T')[0],
  duration: 50,
  notes: '',
  incrementSession: true,
}

const initialAnamnesis = {
  complaint: '',
  healthHistory: '',
  speechDevelopment: '',
  behavior: '',
  clinicalNotes: '',
}

function EvolutionModal({ isOpen, onClose, patient }) {
  const [activeTab, setActiveTab] = useState('evolutions')

  // Estados de Evolução
  const [evolutions, setEvolutions] = useState([])
  const [loadingList, setLoadingList] = useState(true)
  const [formValues, setFormValues] = useState(initialValues)
  const [loadingSubmit, setLoadingSubmit] = useState(false)
  const [refiningText, setRefiningText] = useState(false)

  // Estados de Anamnese
  const [anamnesisValues, setAnamnesisValues] = useState(initialAnamnesis)
  const [loadingAnamnesis, setLoadingAnamnesis] = useState(false)
  const [savingAnamnesis, setSavingAnamnesis] = useState(false)

  // Web Speech API para Transcrição de Voz
  const [isListening, setIsListening] = useState(false)
  const [recognition, setRecognition] = useState(null)

  // Estados dos recursos extras de IA (Exercícios e Progresso)
  const [generatingExercises, setGeneratingExercises] = useState(false)
  const [suggestedExercises, setSuggestedExercises] = useState('')
  const [analyzingProgress, setAnalyzingProgress] = useState(false)
  const [aiProgressAnalysis, setAiProgressAnalysis] = useState('')

  // Configurar Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      const rec = new SpeechRecognition()
      rec.continuous = true
      rec.interimResults = false
      rec.lang = 'pt-BR'

      rec.onresult = (event) => {
        const text = event.results[event.results.length - 1][0].transcript
        setFormValues((prev) => ({
          ...prev,
          notes: prev.notes ? `${prev.notes.trim()} ${text.trim()}.` : `${text.trim()}.`,
        }))
      }

      rec.onerror = (event) => {
        console.error('Erro no reconhecimento de voz:', event.error)
        setIsListening(false)
      }

      rec.onend = () => {
        setIsListening(false)
      }

      setRecognition(rec)
    }
  }, [])

  // Subescrever nas evoluções em tempo real quando o modal abrir para um paciente
  useEffect(() => {
    if (!isOpen || !patient) return

    setLoadingList(true)
    const unsubscribe = subscribeEvolutions(
      patient.id,
      (data) => {
        setEvolutions(data)
        setLoadingList(false)
      },
      (error) => {
        toast.error('Erro ao carregar histórico de evoluções.')
        console.error(error)
        setLoadingList(false)
      }
    )

    // Resetar formulários e análises antigas
    setFormValues({
      date: new Date().toISOString().split('T')[0],
      duration: 50,
      notes: '',
      incrementSession: true,
    })
    setSuggestedExercises('')
    setAiProgressAnalysis('')

    // Resetar para aba inicial ao abrir para novo paciente
    setActiveTab('evolutions')

    return () => {
      unsubscribe()
      if (recognition) recognition.stop()
    }
  }, [isOpen, patient, recognition])

  // Buscar anamnese quando a aba mudar para 'anamnesis'
  useEffect(() => {
    if (!isOpen || !patient || activeTab !== 'anamnesis') return

    const fetchAnamnesis = async () => {
      try {
        setLoadingAnamnesis(true)
        const data = await getAnamnesis(patient.id)
        if (data) {
          setAnamnesisValues({
            complaint: data.complaint || '',
            healthHistory: data.healthHistory || '',
            speechDevelopment: data.speechDevelopment || '',
            behavior: data.behavior || '',
            clinicalNotes: data.clinicalNotes || '',
          })
        } else {
          setAnamnesisValues(initialAnamnesis)
        }
      } catch (error) {
        console.error(error)
        toast.error('Erro ao carregar anamnese.')
      } finally {
        setLoadingAnamnesis(false)
      }
    }

    fetchAnamnesis()
  }, [isOpen, patient, activeTab])

  const toggleSpeech = () => {
    if (!recognition) {
      toast.error('O reconhecimento de voz não é suportado pelo seu navegador.')
      return
    }

    if (isListening) {
      recognition.stop()
    } else {
      try {
        recognition.start()
        setIsListening(true)
        toast.success('Pode falar, estou ouvindo...')
      } catch (error) {
        console.error(error)
      }
    }
  }

  const handleRefineNotes = async () => {
    if (!formValues.notes.trim()) {
      toast.error('Escreva ou dite algo primeiro para refinar com a IA.')
      return
    }

    try {
      setRefiningText(true)
      const systemInstruction = 'Você é um fonoaudiólogo especialista em atendimento domiciliar. Receba anotações clínicas informais, rápidas ou desestruturadas e formate-as como prontuário técnico formal, claro, em português do Brasil. Retorne somente texto simples, sem Markdown, sem asteriscos, sem hashtags, sem blocos de código, sem tabelas e sem títulos decorados. Preserve parágrafos e quebras de linha para facilitar a leitura. Não altere, não invente e não acrescente informações clínicas; mantenha os fatos relatados exatamente iguais, apenas melhore a organização e a linguagem profissional.'
      const prompt = `Formate a seguinte anotação: "${formValues.notes}"`
      
      const refined = await askGemini(prompt, systemInstruction)
      setFormValues((prev) => ({ ...prev, notes: sanitizeAiPlainText(refined) }))
      toast.success('Prontuário refinado com IA!')
    } catch (error) {
      console.error(error)
      toast.error('Erro ao refinar com IA. Verifique se a OPENROUTER_API_KEY está configurada no painel da Vercel.')
    } finally {
      setRefiningText(false)
    }
  }

  const handleGenerateExercises = async () => {
    if (!anamnesisValues.complaint.trim()) {
      toast.error('Por favor, preencha a Queixa Principal antes de gerar exercícios.')
      return
    }

    try {
      setGeneratingExercises(true)
      
      // Calcular idade aproximada do paciente
      let ageStr = 'Idade não informada'
      if (patient.birthDate) {
        const [y, m, d] = patient.birthDate.split('-')
        const birth = new Date(Number(y), Number(m) - 1, Number(d))
        const today = new Date()
        let age = today.getFullYear() - birth.getFullYear()
        const monthDiff = today.getMonth() - birth.getMonth()
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
          age--
        }
        ageStr = `${age} anos`
      }

      const systemInstruction = 'Você é um fonoaudiólogo especialista em atendimento domiciliar infantil e adulto. Proponha sugestões práticas, criativas e divertidas de atividades e jogos fonoaudiológicos domiciliares que os pais ou o próprio paciente possam realizar para tratar uma queixa específica de fala ou linguagem. Responda em português do Brasil, usando somente texto simples, sem Markdown, sem asteriscos, sem hashtags, sem cercas de código, sem links Markdown e sem títulos decorados. Use parágrafos e listas legíveis em texto simples, preservando numeração, pontuação, siglas, fonemas como /r/ e /s/ e todas as informações clínicas fornecidas. Não invente dados clínicos.'
      const prompt = `Gere sugestões de exercícios e atividades domiciliares personalizadas para o paciente de ${ageStr} com a seguinte queixa fonoaudiológica: "${anamnesisValues.complaint}".`
      
      const result = sanitizeAiPlainText(await askGemini(prompt, systemInstruction))
      setSuggestedExercises(result)
      toast.success('Exercícios gerados com IA!')
    } catch (error) {
      console.error(error)
      toast.error('Erro ao gerar exercícios. Verifique se a OPENROUTER_API_KEY está configurada.')
    } finally {
      setGeneratingExercises(false)
    }
  }

  const handleAnalyzeProgress = async () => {
    if (evolutions.length === 0) {
      toast.error('Nenhuma evolução cadastrada para analisar o progresso.')
      return
    }

    try {
      setAnalyzingProgress(true)
      
      // Concatenar histórico de evoluções
      const evolutionsText = evolutions
        .map((evol) => `[Sessão ${evol.date}]: ${evol.notes}`)
        .join('\n\n')

      const systemInstruction = 'Você é um fonoaudiólogo consultor sênior. Analise o histórico de evoluções clínicas de um paciente em atendimento domiciliar e escreva um parecer clínico de progresso. Aponte de forma direta os principais avanços obtidos, as maiores barreiras ou dificuldades persistentes relatadas e sugira as próximas direções terapêuticas ou condutas para otimizar os resultados. Responda em português do Brasil, usando somente texto simples, sem Markdown, sem asteriscos, sem hashtags, sem cercas de código, sem links Markdown, sem tabelas e sem títulos decorados. Use parágrafos e listas legíveis em texto simples, preservando numeração, pontuação, siglas, fonemas como /r/ e /s/ e todas as informações clínicas do histórico. Não altere, não invente e não acrescente fatos clínicos.'
      const prompt = `Analise o seguinte histórico de evoluções clínicas para o paciente ${patient.name}:\n\n${evolutionsText}`
      
      const result = sanitizeAiPlainText(await askGemini(prompt, systemInstruction))
      setAiProgressAnalysis(result)
      toast.success('Análise de progresso gerada com IA!')
    } catch (error) {
      console.error(error)
      toast.error('Erro ao gerar análise de progresso com IA.')
    } finally {
      setAnalyzingProgress(false)
    }
  }

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    const val = type === 'checkbox' ? checked : value
    setFormValues((prev) => ({ ...prev, [name]: val }))
  }

  const handleAnamnesisChange = (event) => {
    const { name, value } = event.target
    setAnamnesisValues((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!formValues.notes.trim()) {
      toast.error('Por favor, escreva as anotações clínicas da evolução.')
      return
    }

    try {
      setLoadingSubmit(true)

      // 1. Criar o registro de evolução
      await createEvolution(patient.id, {
        date: formValues.date,
        duration: Number(formValues.duration) || 50,
        notes: formValues.notes.trim(),
      })

      // 2. Incrementar a sessão do paciente se selecionado
      if (formValues.incrementSession) {
        const nextCompleted = (Number(patient.completedSessions) || 0) + 1
        const remaining = Math.max((Number(patient.totalSessions) || 0) - nextCompleted, 0)
        const status = remaining > 0 ? 'Ativo' : 'Finalizado'

        await updatePatient(patient.id, {
          completedSessions: nextCompleted,
          remainingSessions: remaining,
          status,
        })
      }

      toast.success('Evolução clínica registrada com sucesso!')

      // Limpar campo de anotações
      setFormValues((prev) => ({
        ...prev,
        notes: '',
      }))
    } catch (error) {
      toast.error('Erro ao registrar evolução.')
      console.error(error)
    } finally {
      setLoadingSubmit(false)
    }
  }

  const handleSaveAnamnesisForm = async (event) => {
    event.preventDefault()
    try {
      setSavingAnamnesis(true)
      await saveAnamnesis(patient.id, anamnesisValues)
      toast.success('Anamnese salva com sucesso!')
    } catch (error) {
      console.error(error)
      toast.error('Erro ao salvar anamnese.')
    } finally {
      setSavingAnamnesis(false)
    }
  }

  const handleDelete = async (evolution) => {
    const confirmed = window.confirm('Deseja realmente remover esta evolução?')
    if (!confirmed) return

    try {
      await removeEvolution(patient.id, evolution.id)
      toast.success('Evolução removida.')
    } catch (error) {
      toast.error('Erro ao remover evolução.')
      console.error(error)
    }
  }

  const handleExportPatientData = () => {
    try {
      const dataToExport = {
        paciente: {
          nome: patient.name,
          telefone: patient.phone,
          dataNascimento: patient.birthDate,
          responsavel: patient.guardian,
          endereco: patient.address,
          observacoesCadastro: patient.notes,
          tcleAceito: patient.tcleAccepted ?? false,
          tcleAceitoEm: patient.tcleAcceptedAt ?? null,
        },
        anamnese: {
          queixaPrincipal: anamnesisValues.complaint,
          historicoSaude: anamnesisValues.healthHistory,
          desenvolvimentoFala: anamnesisValues.speechDevelopment,
          comportamento: anamnesisValues.behavior,
          notasClinicas: anamnesisValues.clinicalNotes,
        },
        evolucoes: evolutions.map((evol) => ({
          data: evol.date,
          duracaoMinutos: evol.duration,
          notasEvolucao: evol.notes,
        })),
        exportadoEm: new Date().toISOString(),
      }

      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(dataToExport, null, 2)
      )}`
      
      const downloadAnchor = document.createElement('a')
      downloadAnchor.setAttribute('href', jsonString)
      downloadAnchor.setAttribute(
        'download',
        `prontuario_${patient.name.toLowerCase().replace(/\s+/g, '_')}.json`
      )
      document.body.appendChild(downloadAnchor)
      downloadAnchor.click()
      downloadAnchor.remove()
      
      toast.success('Prontuário exportado com sucesso (Portabilidade LGPD)!')
    } catch (err) {
      console.error(err)
      toast.error('Erro ao exportar prontuário.')
    }
  }

  if (!isOpen || !patient) return null

  // Calcular data de nascimento formatada e idade aproximada
  let formattedBirth = ''
  let ageStr = ''
  if (patient.birthDate) {
    const [y, m, d] = patient.birthDate.split('-')
    formattedBirth = `${d}/${m}/${y}`
    
    // Idade aproximada
    const birth = new Date(Number(y), Number(m) - 1, Number(d))
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    ageStr = `${age} ${age === 1 ? 'ano' : 'anos'}`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex h-[90vh] w-full max-w-4xl flex-col rounded-2xl bg-white dark:bg-noble-900 p-6 shadow-2xl transition-colors duration-200">
        {/* Cabeçalho */}
        <div className="mb-4 flex flex-col gap-2 border-b border-noble-100 dark:border-noble-800 pb-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-xl font-bold text-noble-800 dark:text-noble-100">Prontuário Clínico</h3>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-noble-500 dark:text-noble-400">
              <p>Paciente: <strong className="text-noble-750 dark:text-noble-200">{patient.name}</strong></p>
              {formattedBirth && <p>Nascimento: <strong className="text-noble-750 dark:text-noble-200">{formattedBirth} ({ageStr})</strong></p>}
              {patient.complaint && <p>Queixa: <strong className="text-noble-750 dark:text-noble-200">{patient.complaint}</strong></p>}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleExportPatientData}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 transition"
              title="Exportar prontuário em JSON (Portabilidade LGPD)"
            >
              Exportar (LGPD) 📤
            </button>
            <button
              type="button"
              onClick={() => window.open(`/imprimir/paciente/${patient.id}`, '_blank')}
              className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-700 transition"
            >
              Imprimir Prontuário 🖨️
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-noble-300 dark:border-noble-700 px-3 py-1.5 text-sm font-semibold text-noble-600 dark:text-noble-400 hover:bg-noble-50 dark:hover:bg-noble-800 transition"
            >
              Fechar
            </button>
          </div>
        </div>

        {/* Abas */}
        <div className="mb-6 flex border-b border-noble-200 dark:border-noble-800">
          <button
            type="button"
            onClick={() => setActiveTab('evolutions')}
            className={`pb-3 text-sm font-bold border-b-2 px-4 transition-colors ${
              activeTab === 'evolutions'
                ? 'border-plum-600 text-plum-600 dark:text-plum-400'
                : 'border-transparent text-noble-500 dark:text-noble-400 hover:text-noble-700 dark:hover:text-noble-200'
            }`}
          >
            Histórico e Evoluções
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('anamnesis')}
            className={`pb-3 text-sm font-bold border-b-2 px-4 transition-colors ${
              activeTab === 'anamnesis'
                ? 'border-plum-600 text-plum-600 dark:text-plum-400'
                : 'border-transparent text-noble-500 dark:text-noble-400 hover:text-noble-700 dark:hover:text-noble-200'
            }`}
          >
            Anamnese (Avaliação Inicial)
          </button>
        </div>

        {/* Corpo Condicional por Aba */}
        {activeTab === 'evolutions' ? (
          <div className="grid flex-1 grid-cols-1 gap-6 overflow-hidden md:grid-cols-2">
            {/* Coluna Esquerda: Nova Evolução */}
            <div className="flex flex-col border-r border-noble-100 dark:border-noble-800 pr-0 md:pr-6 overflow-y-auto">
              <h4 className="mb-4 text-base font-bold text-noble-800 dark:text-noble-100">Registrar Sessão</h4>
              <form onSubmit={handleSubmit} className="space-y-4">
                <InputField
                  label="Data da Sessão"
                  type="date"
                  name="date"
                  value={formValues.date}
                  onChange={handleChange}
                  required
                />
                <InputField
                  label="Duração (minutos)"
                  type="number"
                  name="duration"
                  value={formValues.duration}
                  onChange={handleChange}
                  required
                />
                
                {/* Campo de Anotações Clínicas Customizado com Microfone */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-noble-700 dark:text-noble-300">
                      Anotações Clínicas *
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={toggleSpeech}
                        className={`text-[11px] px-2 py-0.5 rounded-lg border font-semibold flex items-center gap-1 transition ${
                          isListening
                            ? 'bg-red-500 border-red-500 text-white animate-pulse'
                            : 'bg-white dark:bg-noble-800 border-noble-300 dark:border-noble-700 text-noble-700 dark:text-noble-300 hover:bg-noble-50 dark:hover:bg-noble-750'
                        }`}
                      >
                        <span>{isListening ? 'Ouvindo... 🛑' : 'Ditar 🎙️'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleRefineNotes}
                        disabled={refiningText}
                        className="text-[11px] px-2 py-0.5 rounded-lg border font-semibold flex items-center gap-1 transition bg-white dark:bg-noble-800 border-noble-300 dark:border-noble-700 text-plum-600 dark:text-plum-400 hover:bg-plum-50 dark:hover:bg-noble-750 disabled:opacity-50"
                      >
                        <span>{refiningText ? 'Refinando... ✨' : 'Melhorar notas ✨'}</span>
                      </button>
                    </div>
                  </div>
                  <textarea
                    name="notes"
                    value={formValues.notes}
                    onChange={handleChange}
                    placeholder="Descreva as atividades, progresso e comportamento do paciente durante a sessão..."
                    rows={4}
                    className="w-full rounded-xl border border-noble-200 dark:border-noble-700 bg-white dark:bg-noble-800 px-4 py-2.5 text-sm text-noble-800 dark:text-noble-100 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-plum-300 dark:focus:ring-plum-800"
                    required
                  />
                </div>

                <div className="flex items-center gap-2 rounded-xl bg-plum-50/50 dark:bg-plum-950/20 p-3.5 border border-plum-100 dark:border-plum-900/60">
                  <input
                    type="checkbox"
                    id="incrementSession"
                    name="incrementSession"
                    checked={formValues.incrementSession}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-noble-300 dark:border-noble-700 text-plum-600 focus:ring-plum-500"
                  />
                  <label htmlFor="incrementSession" className="text-xs font-semibold text-plum-900 dark:text-plum-300 cursor-pointer">
                    Incrementar automaticamente +1 sessão realizada no cadastro do paciente.
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loadingSubmit}
                  className="w-full rounded-xl bg-plum-600 py-3 text-sm font-semibold text-white transition hover:bg-plum-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loadingSubmit ? 'Registrando...' : 'Registrar Evolução'}
                </button>
              </form>
            </div>

            {/* Coluna Direita: Histórico */}
            <div className="flex flex-col overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-base font-bold text-noble-800 dark:text-noble-100">Histórico de Atendimentos</h4>
                {evolutions.length > 0 && (
                  <button
                    type="button"
                    onClick={handleAnalyzeProgress}
                    disabled={analyzingProgress}
                    className="text-xs px-2.5 py-1 rounded-lg border border-noble-300 dark:border-noble-700 font-semibold flex items-center gap-1 transition bg-white dark:bg-noble-800 text-plum-600 dark:text-plum-400 hover:bg-plum-50 dark:hover:bg-noble-750 disabled:opacity-50"
                  >
                    <span>{analyzingProgress ? 'Analisando... 📈' : 'Análise com IA 📈'}</span>
                  </button>
                )}
              </div>

              {/* Box de Análise de Progresso por IA */}
              {aiProgressAnalysis && (
                <div className="rounded-xl border border-plum-200 dark:border-plum-900 bg-plum-50/50 dark:bg-plum-950/10 p-4 mb-4 relative group transition-all duration-200">
                  <button
                    type="button"
                    onClick={() => setAiProgressAnalysis('')}
                    className="absolute right-3 top-3 text-[10px] text-neutral-450 hover:text-red-500 font-bold"
                  >
                    Fechar Análise
                  </button>
                  <h5 className="text-xs font-bold text-plum-700 dark:text-plum-300 uppercase tracking-wider mb-2">Parecer de Progresso (IA)</h5>
                  <p className="whitespace-pre-wrap text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed font-sans">{aiProgressAnalysis}</p>
                </div>
              )}

              {loadingList ? (
                <div className="flex flex-1 items-center justify-center py-10">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-plum-200 border-t-plum-600" />
                </div>
              ) : evolutions.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
                  <p className="text-sm font-medium text-noble-500 dark:text-noble-400">Nenhuma evolução registrada para este paciente.</p>
                  <p className="text-xs text-noble-400 dark:text-noble-500 mt-1">Utilize o formulário ao lado para registrar o primeiro atendimento.</p>
                </div>
              ) : (
                <div className="space-y-4 pr-1">
                  {evolutions.map((evol) => {
                    const [year, month, day] = evol.date.split('-')
                    const formattedDate = `${day}/${month}/${year}`

                    return (
                      <div
                        key={evol.id}
                        className="rounded-xl border border-noble-200 dark:border-noble-800 bg-white dark:bg-noble-950 p-4 shadow-sm relative group hover:border-noble-300 dark:hover:border-noble-700 transition-all duration-200"
                      >
                        <button
                          type="button"
                          onClick={() => handleDelete(evol)}
                          className="absolute right-3 top-3 text-xs text-red-500 opacity-0 group-hover:opacity-100 transition hover:underline"
                        >
                          Excluir
                        </button>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="rounded bg-noble-100 dark:bg-noble-800 px-2 py-0.5 text-xs font-semibold text-noble-600 dark:text-noble-300">
                            {formattedDate}
                          </span>
                          <span className="text-xs text-noble-500 dark:text-noble-400">
                            {evol.duration} min
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap text-sm text-noble-700 dark:text-noble-300 leading-relaxed font-sans">{evol.notes}</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {loadingAnamnesis ? (
              <div className="flex flex-1 items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-plum-200 border-t-plum-600" />
              </div>
            ) : (
              <form onSubmit={handleSaveAnamnesisForm} className="space-y-6 max-w-2xl pb-6">
                <div>
                  <h4 className="text-base font-bold text-noble-800 dark:text-noble-100 mb-1">Avaliação e Anamnese</h4>
                  <p className="text-xs text-noble-500 dark:text-noble-400">Registre o histórico de desenvolvimento e queixas iniciais para o atendimento domiciliar.</p>
                </div>

                <InputField
                  label="Queixa Principal / Motivo da Consulta"
                  type="textarea"
                  name="complaint"
                  value={anamnesisValues.complaint}
                  onChange={handleAnamnesisChange}
                  placeholder="Descreva a queixa trazida pelos pais ou responsáveis..."
                />

                <InputField
                  label="Histórico de Saúde & Diagnósticos Anteriores"
                  type="textarea"
                  name="healthHistory"
                  value={anamnesisValues.healthHistory}
                  onChange={handleAnamnesisChange}
                  placeholder="Informações sobre parto, doenças pregressas, diagnósticos médicos ou outras terapias..."
                />

                <InputField
                  label="Desenvolvimento de Fala e Linguagem"
                  type="textarea"
                  name="speechDevelopment"
                  value={anamnesisValues.speechDevelopment}
                  onChange={handleAnamnesisChange}
                  placeholder="Marcos do desenvolvimento (idade que começou a balbuciar, primeiras palavras, dificuldades observadas)..."
                />

                <InputField
                  label="Comportamento e Interação Social"
                  type="textarea"
                  name="behavior"
                  value={anamnesisValues.behavior}
                  onChange={handleAnamnesisChange}
                  placeholder="Contato visual, atenção compartilhada, comportamento nas visitas domiciliares, interação..."
                />

                <InputField
                  label="Observações Clínicas e Diretrizes"
                  type="textarea"
                  name="clinicalNotes"
                  value={anamnesisValues.clinicalNotes}
                  onChange={handleAnamnesisChange}
                  placeholder="Diretrizes iniciais do plano terapêutico..."
                />

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={savingAnamnesis}
                    className="rounded-xl bg-plum-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-plum-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingAnamnesis ? 'Salvando Anamnese...' : 'Salvar Anamnese'}
                  </button>

                  <button
                    type="button"
                    onClick={handleGenerateExercises}
                    disabled={generatingExercises || !anamnesisValues.complaint}
                    className="rounded-xl border border-green-600 dark:border-green-800 bg-white dark:bg-noble-850 px-6 py-3 text-sm font-semibold text-green-600 dark:text-green-400 transition hover:bg-green-50 dark:hover:bg-noble-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {generatingExercises ? 'Gerando Exercícios... 🎯' : 'Sugerir Exercícios com IA 🎯'}
                  </button>
                </div>

                {/* Box de Sugestões de Exercícios de IA */}
                {suggestedExercises && (
                  <div className="rounded-xl border border-green-200 dark:border-green-950 bg-green-50/50 dark:bg-green-950/10 p-5 mt-6 transition-colors duration-200">
                    <h5 className="text-sm font-bold text-green-700 dark:text-green-300 uppercase tracking-wider mb-2">Sugestões de Atividades Domiciliares (IA)</h5>
                    <p className="whitespace-pre-wrap text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed font-sans">{suggestedExercises}</p>
                  </div>
                )}
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default EvolutionModal
