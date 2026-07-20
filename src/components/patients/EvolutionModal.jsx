import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import InputField from '../common/InputField'
import { completeScheduledEvolution, createClinicalEvolution, getEvolutionRevisions, removeEvolution, reviseEvolution, saveEvolutionDraft, saveProgressAnalysis, subscribeEvolutionDrafts, subscribeEvolutions, subscribeProgressAnalyses } from '../../services/patientService'
import { recordAuditEvent } from '../../services/auditService'
import { getAnamnesis, saveAnamnesis } from '../../services/anamnesisService'
import { askGemini } from '../../services/geminiService'
import { buildSanitizedPrompt, minimizeClinicalText, sanitizeAiPlainText } from '../../utils/aiPrivacy'
import AIConsentModal from './AIConsentModal'
import DocumentsTab from './DocumentsTab'
import TherapeuticPlanTab from './TherapeuticPlanTab'
import { objectiveStatuses, subscribeTherapeuticPlan } from '../../services/therapeuticPlanService'

const initialValues = {
  date: new Date().toISOString().split('T')[0],
  duration: 50,
  notes: '',
  incrementSession: true,
}

const initialAnamnesis = {
  interviewDate: '',
  informant: '',
  informantRelationship: '',
  referralSource: '',
  complaint: '',
  familyGoals: '',
  pregnancyBirthHistory: '',
  developmentalHistory: '',
  healthHistory: '',
  medicationsAllergies: '',
  familyHistory: '',
  hearingHistory: '',
  speechDevelopment: '',
  languagesCommunication: '',
  educationOccupation: '',
  feedingSwallowing: '',
  oralMotorHabits: '',
  breathingSleep: '',
  voiceHistory: '',
  behavior: '',
  functionalImpact: '',
  previousCare: '',
  warningSigns: '',
  clinicalNotes: '',
}

const anamnesisExportLabels = {
  interviewDate: 'Data da entrevista', informant: 'Informante', informantRelationship: 'Relação com o paciente',
  referralSource: 'Origem do encaminhamento', complaint: 'Queixa principal / motivo da consulta',
  familyGoals: 'Expectativas e prioridades', pregnancyBirthHistory: 'Gestação, nascimento e período neonatal',
  developmentalHistory: 'Desenvolvimento global', healthHistory: 'Histórico de saúde e diagnósticos',
  medicationsAllergies: 'Medicamentos e alergias', familyHistory: 'Antecedentes familiares',
  hearingHistory: 'Histórico auditivo e otorrinolaringológico', speechDevelopment: 'Desenvolvimento de fala e linguagem',
  languagesCommunication: 'Idiomas e formas de comunicação', educationOccupation: 'Contexto escolar ou profissional',
  feedingSwallowing: 'Alimentação e deglutição', oralMotorHabits: 'Motricidade orofacial e hábitos orais',
  breathingSleep: 'Respiração e sono', voiceHistory: 'Voz e demanda vocal', behavior: 'Comportamento e interação social',
  functionalImpact: 'Impacto funcional e participação', previousCare: 'Avaliações, terapias e exames anteriores',
  warningSigns: 'Sinais de alerta e intercorrências', clinicalNotes: 'Observações clínicas, condutas e encaminhamentos',
}

function AnamnesisSection({ title, description, children, open = false }) {
  return (
    <details open={open} className="group overflow-hidden rounded-xl border-2 border-noble-500 bg-white shadow-md dark:border-noble-400 dark:bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 border-l-[6px] border-plum-700 bg-white px-5 py-4 transition hover:bg-noble-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-plum-500 dark:border-plum-700 dark:bg-white dark:hover:bg-noble-100">
        <span>
          <span
            className="block text-xl font-extrabold leading-7 tracking-normal !text-black dark:!text-black"
            style={{ color: '#111111' }}
          >
            {title}
          </span>
          {description && <span className="mt-1.5 block text-sm font-semibold leading-6 text-noble-700 dark:text-noble-700">{description}</span>}
        </span>
        <span aria-hidden="true" className="min-w-9 rounded-lg bg-plum-800 px-2 py-1 text-center text-xl font-black text-white transition group-open:rotate-45 dark:bg-plum-800 dark:text-white">+</span>
      </summary>
      <div className="grid grid-cols-1 gap-4 border-t border-noble-300 bg-white p-4 dark:border-noble-600 dark:bg-noble-900 md:grid-cols-2">{children}</div>
    </details>
  )
}

function EvolutionModal({ isOpen, onClose, patient, linkedSchedule = null, onScheduleCompleted }) {
  const [activeTab, setActiveTab] = useState('evolutions')

  const [evolutions, setEvolutions] = useState([])
  const [selectedEvolutionIds, setSelectedEvolutionIds] = useState([])
  const [expandedEvolutionIds, setExpandedEvolutionIds] = useState([])
  const [historyFilters, setHistoryFilters] = useState({ search: '', dateFrom: '', dateTo: '' })
  const [editingEvolution, setEditingEvolution] = useState(null)
  const [revisionValues, setRevisionValues] = useState({ date: '', duration: 50, notes: '', reason: '' })

  useEffect(() => {
    if (!isOpen || !patient?.id) return
    recordAuditEvent({ action: 'record.viewed', patientId: patient.id, resourceId: patient.id })
      .catch((error) => console.error('Falha ao registrar consulta do prontuário:', error))
  }, [isOpen, patient?.id])
  const [revisionHistory, setRevisionHistory] = useState([])
  const [loadingRevisions, setLoadingRevisions] = useState(false)
  const [savingRevision, setSavingRevision] = useState(false)
  const [isRevisionExpanded, setIsRevisionExpanded] = useState(false)
  const [loadingList, setLoadingList] = useState(true)
  const [formValues, setFormValues] = useState(initialValues)
  const [loadingSubmit, setLoadingSubmit] = useState(false)
  const [refiningText, setRefiningText] = useState(false)
  const [isNotesExpanded, setIsNotesExpanded] = useState(false)
  const [therapeuticPlan, setTherapeuticPlan] = useState(null)
  const [loadingTherapeuticPlan, setLoadingTherapeuticPlan] = useState(true)
  const [objectiveProgress, setObjectiveProgress] = useState([])
  const [evolutionDrafts, setEvolutionDrafts] = useState([])
  const [selectedDraftId, setSelectedDraftId] = useState('')
  const [savingDraft, setSavingDraft] = useState(false)

  const [anamnesisValues, setAnamnesisValues] = useState(initialAnamnesis)
  const [loadingAnamnesis, setLoadingAnamnesis] = useState(false)
  const [savingAnamnesis, setSavingAnamnesis] = useState(false)

  const [isListening, setIsListening] = useState(false)
  const [recognition, setRecognition] = useState(null)

  const [generatingExercises, setGeneratingExercises] = useState(false)
  const [suggestedExercises, setSuggestedExercises] = useState('')
  const [analyzingProgress, setAnalyzingProgress] = useState(false)
  const [aiProgressAnalysis, setAiProgressAnalysis] = useState('')
  const [savedProgressAnalyses, setSavedProgressAnalyses] = useState([])
  const [savedAnalysisId, setSavedAnalysisId] = useState('')
  const [savingAnalysis, setSavingAnalysis] = useState(false)
  const [isAnalysisExpanded, setIsAnalysisExpanded] = useState(false)

  const [consentState, setConsentState] = useState({ isOpen: false, actionLabel: '' })

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

  useEffect(() => {
    if (!isOpen || !patient) return

    setLoadingList(true)
    const unsubscribe = subscribeEvolutions(
      patient.id,
      (data) => {
        setEvolutions(data)
        setSelectedEvolutionIds((currentIds) => (
          currentIds.filter((id) => data.some((evolution) => evolution.id === id))
        ))
        setLoadingList(false)
      },
      (error) => {
        toast.error('Erro ao carregar histórico de evoluções.')
        console.error(error)
        setLoadingList(false)
      }
    )

    const startMinutes = linkedSchedule?.startTime
      ? Number(linkedSchedule.startTime.split(':')[0]) * 60 + Number(linkedSchedule.startTime.split(':')[1])
      : 0
    const endMinutes = linkedSchedule?.endTime
      ? Number(linkedSchedule.endTime.split(':')[0]) * 60 + Number(linkedSchedule.endTime.split(':')[1])
      : 0

    setFormValues({
      date: linkedSchedule?.date || new Date().toISOString().split('T')[0],
      duration: endMinutes > startMinutes ? endMinutes - startMinutes : 50,
      notes: '',
      incrementSession: true,
    })
    setSuggestedExercises('')
    setAiProgressAnalysis('')
    setSelectedDraftId('')
    setIsNotesExpanded(false)
    setObjectiveProgress([])

    setActiveTab('evolutions')

    return () => {
      unsubscribe()
      if (recognition) recognition.stop()
    }
  }, [isOpen, patient, recognition, linkedSchedule])

  useEffect(() => {
    if (!isOpen || !patient) return undefined
    return subscribeProgressAnalyses(
      patient.id,
      setSavedProgressAnalyses,
      (error) => {
        console.error(error)
        toast.error('Erro ao carregar pareceres salvos.')
      },
    )
  }, [isOpen, patient])

  useEffect(() => {
    if (!isOpen || !patient) return undefined
    setLoadingTherapeuticPlan(true)
    return subscribeTherapeuticPlan(
      patient.id,
      (plan) => {
        setTherapeuticPlan(plan)
        setLoadingTherapeuticPlan(false)
      },
      (error) => {
        console.error(error)
        toast.error('Erro ao carregar o plano terapêutico.')
        setLoadingTherapeuticPlan(false)
      },
    )
  }, [isOpen, patient])

  useEffect(() => {
    if (!isOpen || !patient) return undefined
    return subscribeEvolutionDrafts(
      patient.id,
      setEvolutionDrafts,
      (error) => {
        console.error(error)
        toast.error('Erro ao carregar rascunhos de evolução.')
      },
    )
  }, [isOpen, patient])

  useEffect(() => {
    if (!isOpen || !patient || activeTab !== 'anamnesis') return

    const fetchAnamnesis = async () => {
      try {
        setLoadingAnamnesis(true)
        const data = await getAnamnesis(patient.id)
        if (data) {
          setAnamnesisValues({
            ...initialAnamnesis,
            ...Object.fromEntries(Object.keys(initialAnamnesis).map((key) => [key, data[key] || ''])),
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

  const requireConsent = (actionLabel, callback) => {
    setConsentState({ isOpen: true, actionLabel, callback })
  }

  const handleConfirm = () => {
    const { callback } = consentState
    setConsentState({ isOpen: false, actionLabel: '' })
    if (callback) callback()
  }

  const handleCancel = () => {
    setConsentState({ isOpen: false, actionLabel: '' })
  }

  const handleRefineNotes = async () => {
    if (!formValues.notes.trim()) {
      toast.error('Escreva ou dite algo primeiro para refinar com a IA.')
      return
    }

    requireConsent('Melhorar notas clínicas com IA', async () => {
      try {
        setRefiningText(true)
        const minimizedNotes = minimizeClinicalText(formValues.notes.trim(), patient)
        const { prompt, systemInstruction } = buildSanitizedPrompt('refine-notes', {
          notes: minimizedNotes,
        })
        const refined = await askGemini(prompt, systemInstruction)
        setFormValues((prev) => ({ ...prev, notes: sanitizeAiPlainText(refined).trim() }))
        toast.success('Prontuário refinado com IA!')
      } catch (error) {
        console.error(error)
        toast.error('Erro ao refinar com IA.')
      } finally {
        setRefiningText(false)
      }
    })
  }

  const handleGenerateExercises = async () => {
    if (!anamnesisValues.complaint.trim()) {
      toast.error('Por favor, preencha a Queixa Principal antes de gerar exercícios.')
      return
    }

    requireConsent('Sugerir exercícios com IA', async () => {
      try {
        setGeneratingExercises(true)
        const minimizedComplaint = minimizeClinicalText(anamnesisValues.complaint.trim(), patient)
        const { prompt, systemInstruction } = buildSanitizedPrompt('generate-exercises', {
          complaint: minimizedComplaint,
          birthDate: patient.birthDate,
        })
        const result = await askGemini(prompt, systemInstruction)
        setSuggestedExercises(sanitizeAiPlainText(result))
        toast.success('Exercícios gerados com IA!')
      } catch (error) {
        console.error(error)
        toast.error('Erro ao gerar exercícios.')
      } finally {
        setGeneratingExercises(false)
      }
    })
  }

  const handleAnalyzeProgress = async () => {
    if (evolutions.length === 0) {
      toast.error('Nenhuma evolução cadastrada para analisar o progresso.')
      return
    }

    requireConsent('Analisar progresso com IA', async () => {
      try {
        setAnalyzingProgress(true)

        const evolutionsText = evolutions
          .map((evol) => `[Sessão ${evol.date}]: ${evol.notes}`)
          .join('\n\n')
        const minimizedText = minimizeClinicalText(evolutionsText, patient)

        const { prompt, systemInstruction } = buildSanitizedPrompt('analyze-progress', {
          evolutionsText: minimizedText,
        })
        const result = await askGemini(prompt, systemInstruction)
        setAiProgressAnalysis(sanitizeAiPlainText(result))
        setSavedAnalysisId('')
        toast.success('Análise de progresso gerada com IA!')
      } catch (error) {
        console.error(error)
        toast.error('Erro ao gerar análise de progresso.')
      } finally {
        setAnalyzingProgress(false)
      }
    })
  }

  const persistProgressAnalysis = async () => {
    if (!aiProgressAnalysis.trim()) {
      toast.error('Não há conteúdo para salvar.')
      return ''
    }

    setSavingAnalysis(true)
    try {
      const analysisId = await saveProgressAnalysis(patient.id, aiProgressAnalysis.trim(), savedAnalysisId)
      setSavedAnalysisId(analysisId)
      toast.success(savedAnalysisId ? 'Parecer atualizado.' : 'Parecer salvo no prontuário.')
      return analysisId
    } catch (error) {
      console.error(error)
      toast.error('Erro ao salvar o parecer.')
      return ''
    } finally {
      setSavingAnalysis(false)
    }
  }

  const handlePrintProgressAnalysis = async () => {
    const analysisId = await persistProgressAnalysis()
    if (analysisId) window.open(`/imprimir/paciente/${patient.id}?analise=${analysisId}`, '_blank')
  }

  const handleCopyProgressAnalysis = async () => {
    try {
      await navigator.clipboard.writeText(aiProgressAnalysis)
      toast.success('Parecer copiado.')
    } catch (error) {
      console.error(error)
      toast.error('Não foi possível copiar o parecer.')
    }
  }

  const persistEvolutionDraft = async () => {
    if (!formValues.notes.trim()) {
      toast.error('Escreva ou gere a evolução antes de salvar.')
      return ''
    }
    setSavingDraft(true)
    try {
      const draftId = await saveEvolutionDraft(
        patient.id,
        { ...formValues, notes: formValues.notes.trim() },
        selectedDraftId,
      )
      setSelectedDraftId(draftId)
      toast.success(selectedDraftId ? 'Rascunho atualizado.' : 'Rascunho salvo no prontuário.')
      return draftId
    } catch (error) {
      console.error(error)
      toast.error('Erro ao salvar o rascunho.')
      return ''
    } finally {
      setSavingDraft(false)
    }
  }

  const handlePrintEvolutionDraft = async () => {
    const draftId = await persistEvolutionDraft()
    if (draftId) window.open(`/imprimir/paciente/${patient.id}?rascunho=${draftId}`, '_blank')
  }

  const handleCopyEvolutionNotes = async () => {
    try {
      await navigator.clipboard.writeText(formValues.notes)
      toast.success('Evolução copiada.')
    } catch (error) {
      console.error(error)
      toast.error('Não foi possível copiar a evolução.')
    }
  }

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    const val = type === 'checkbox' ? checked : value
    setFormValues((prev) => ({ ...prev, [name]: val }))
  }

  const toggleObjectiveProgress = (objective) => {
    setObjectiveProgress((current) => current.some((item) => item.objectiveId === objective.id)
      ? current.filter((item) => item.objectiveId !== objective.id)
      : [...current, {
          objectiveId: objective.id,
          description: objective.description,
          area: objective.area,
          status: objective.status || 'Em desenvolvimento',
          performance: '',
        }])
  }

  const updateObjectiveProgress = (objectiveId, field, value) => {
    setObjectiveProgress((current) => current.map((item) => item.objectiveId === objectiveId ? { ...item, [field]: value } : item))
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

      const evolutionPayload = {
        date: formValues.date,
        duration: Number(formValues.duration) || 50,
        notes: formValues.notes.trim(),
        objectiveProgress,
      }

      if (linkedSchedule) {
        await completeScheduledEvolution(patient.id, linkedSchedule.id, evolutionPayload)
      } else {
        await createClinicalEvolution(patient.id, evolutionPayload, formValues.incrementSession)
      }

      toast.success('Evolução clínica registrada com sucesso!')

      if (linkedSchedule) {
        onScheduleCompleted?.()
      }

      setFormValues((prev) => ({
        ...prev,
        notes: '',
      }))
      setSelectedDraftId('')
      setObjectiveProgress([])
    } catch (error) {
      toast.error(
        error.code === 'schedule/already-completed'
          ? 'Este atendimento já foi registrado e não será contabilizado novamente.'
          : 'Erro ao registrar evolução.'
      )
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
    if (evolution.revisionCount > 0) {
      toast.error('Registros retificados não podem ser excluídos, pois possuem histórico clínico preservado.')
      return
    }
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

  const handleExportPatientData = async () => {
    try {
      const dataToExport = {
        paciente: {
          nome: patient.name,
          telefone: patient.phone,
          dataNascimento: patient.birthDate,
          responsavel: patient.guardian,
          diagnostico: patient.diagnosis,
          profissionalResponsavel: patient.professionalName,
          crfa: patient.crfa,
          endereco: patient.address,
          observacoesCadastro: patient.notes,
          tcleAceito: patient.tcleAccepted ?? false,
          tcleAceitoEm: patient.tcleAcceptedAt ?? null,
        },
        anamnese: Object.fromEntries(
          Object.entries(anamnesisExportLabels).map(([key, label]) => [label, anamnesisValues[key]])
        ),
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

      await recordAuditEvent({ action: 'record.exported', patientId: patient.id, resourceId: patient.id })

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

  const filteredEvolutions = useMemo(() => {
    const search = historyFilters.search.trim().toLocaleLowerCase('pt-BR')
    return evolutions.filter((evolution) => {
      const matchesSearch = !search || evolution.notes?.toLocaleLowerCase('pt-BR').includes(search)
      const matchesStart = !historyFilters.dateFrom || evolution.date >= historyFilters.dateFrom
      const matchesEnd = !historyFilters.dateTo || evolution.date <= historyFilters.dateTo
      return matchesSearch && matchesStart && matchesEnd
    })
  }, [evolutions, historyFilters])

  const handlePrintFilteredEvolutions = () => {
    if (selectedEvolutionIds.length === 0 && !historyFilters.dateFrom && !historyFilters.dateTo) {
      toast.error('Selecione atendimentos ou informe um período para gerar o PDF.')
      return
    }

    const params = new URLSearchParams()
    if (selectedEvolutionIds.length > 0) {
      params.set('evolucoes', selectedEvolutionIds.join(','))
    } else {
      if (historyFilters.dateFrom) params.set('dataInicial', historyFilters.dateFrom)
      if (historyFilters.dateTo) params.set('dataFinal', historyFilters.dateTo)
    }
    window.open(`/imprimir/paciente/${patient.id}?${params.toString()}`, '_blank')
  }

  const openRevisionModal = async (evolution) => {
    setIsRevisionExpanded(false)
    setEditingEvolution(evolution)
    setRevisionValues({
      date: evolution.date || '',
      duration: Number(evolution.duration) || 50,
      notes: evolution.notes || '',
      reason: '',
    })
    setLoadingRevisions(true)
    try {
      setRevisionHistory(await getEvolutionRevisions(patient.id, evolution.id))
    } catch (error) {
      console.error(error)
      toast.error('Erro ao carregar o histórico de retificações.')
    } finally {
      setLoadingRevisions(false)
    }
  }

  const persistRevision = async (closeAfterSave = true) => {
    if (!revisionValues.notes.trim() || !revisionValues.reason.trim()) {
      toast.error('Informe as anotações e o motivo da retificação.')
      return false
    }

    try {
      setSavingRevision(true)
      await reviseEvolution(
        patient.id,
        editingEvolution.id,
        { ...revisionValues, notes: revisionValues.notes.trim() },
        revisionValues.reason.trim(),
      )
      toast.success('Evolução retificada com histórico preservado.')
      if (closeAfterSave) {
        setEditingEvolution(null)
        setRevisionHistory([])
        setIsRevisionExpanded(false)
      }
      return true
    } catch (error) {
      console.error(error)
      toast.error('Erro ao retificar a evolução.')
      return false
    } finally {
      setSavingRevision(false)
    }
  }

  const handleSaveRevision = async (event) => {
    event.preventDefault()
    await persistRevision(true)
  }

  const handleSaveRevisionAndPrint = async () => {
    const printWindow = window.open('', '_blank')
    const saved = await persistRevision(false)
    if (!saved) {
      printWindow?.close()
      return
    }
    const params = new URLSearchParams({ evolucao: editingEvolution.id })
    if (printWindow) printWindow.location.href = `/imprimir/paciente/${patient.id}?${params.toString()}`
    setEditingEvolution(null)
    setRevisionHistory([])
    setIsRevisionExpanded(false)
  }

  const handleCopyRevision = async () => {
    try {
      await navigator.clipboard.writeText(revisionValues.notes)
      toast.success('Evolução copiada.')
    } catch (error) {
      console.error(error)
      toast.error('Não foi possível copiar a evolução.')
    }
  }

  if (!isOpen || !patient) return null

  let formattedBirth = ''
  let ageStr = ''
  if (patient.birthDate) {
    const [y, m, d] = patient.birthDate.split('-')
    formattedBirth = `${d}/${m}/${y}`

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
        <div className="mb-4 flex flex-col gap-2 border-b border-noble-100 dark:border-noble-800 pb-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-xl font-bold text-noble-800 dark:text-noble-100">Prontuário Clínico</h3>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-noble-500 dark:text-noble-400">
              <p>Paciente: <strong className="text-noble-750 dark:text-noble-200">{patient.name}</strong></p>
              {formattedBirth && <p>Nascimento: <strong className="text-noble-750 dark:text-noble-200">{formattedBirth} ({ageStr})</strong></p>}
              {patient.complaint && <p>Queixa: <strong className="text-noble-750 dark:text-noble-200">{patient.complaint}</strong></p>}
              {patient.diagnosis && <p>Diagnóstico: <strong className="text-noble-750 dark:text-noble-200">{patient.diagnosis}</strong></p>}
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
          <button
            type="button"
            onClick={() => setActiveTab('plan')}
            className={`pb-3 text-sm font-bold border-b-2 px-4 transition-colors ${
              activeTab === 'plan'
                ? 'border-plum-600 text-plum-600 dark:text-plum-400'
                : 'border-transparent text-noble-500 dark:text-noble-400 hover:text-noble-700 dark:hover:text-noble-200'
            }`}
          >
            Plano Terapêutico
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('documents')}
            className={`pb-3 text-sm font-bold border-b-2 px-4 transition-colors ${
              activeTab === 'documents'
                ? 'border-plum-600 text-plum-600 dark:text-plum-400'
                : 'border-transparent text-noble-500 dark:text-noble-400 hover:text-noble-700 dark:hover:text-noble-200'
            }`}
          >
            Documentos e Anexos
          </button>
        </div>

        {activeTab === 'evolutions' && (
          <div className="grid flex-1 grid-cols-1 gap-6 overflow-hidden md:grid-cols-2">
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

                <div className={`flex flex-col gap-3 ${isNotesExpanded ? 'fixed inset-4 z-[70] overflow-y-auto rounded-2xl border-2 border-plum-400 bg-white p-6 shadow-2xl dark:bg-noble-900 md:inset-10' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-base font-bold text-noble-800 dark:text-white">Evolução Clínica *</span>
                      {isNotesExpanded && <p className="mt-1 text-xs text-noble-500 dark:text-noble-400">Revise e edite o conteúdo antes de registrar ou emitir o PDF.</p>}
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsNotesExpanded((expanded) => !expanded)}
                        aria-expanded={isNotesExpanded}
                        aria-controls="clinical-notes-field"
                        className="text-[11px] px-2 py-0.5 rounded-lg border font-semibold flex items-center gap-1 transition bg-white dark:bg-noble-800 border-noble-300 dark:border-noble-700 text-noble-700 dark:text-noble-200 hover:bg-noble-50 dark:hover:bg-noble-750"
                      >
                        <span>{isNotesExpanded ? 'Reduzir' : 'Ampliar'}</span>
                      </button>
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
                  {evolutionDrafts.length > 0 && (
                    <select
                      value={selectedDraftId}
                      onChange={(event) => {
                        const draft = evolutionDrafts.find((item) => item.id === event.target.value)
                        setSelectedDraftId(event.target.value)
                        if (draft) setFormValues((values) => ({ ...values, date: draft.date || values.date, duration: draft.duration || values.duration, notes: draft.notes || '' }))
                      }}
                      className="w-full rounded-xl border border-noble-300 bg-white px-3 py-2 text-sm text-noble-800 dark:border-noble-700 dark:bg-noble-800 dark:text-white"
                    >
                      <option value="">Reabrir um rascunho salvo</option>
                      {evolutionDrafts.map((draft, index) => (
                        <option key={draft.id} value={draft.id}>Rascunho {evolutionDrafts.length - index}{draft.updatedAt?.toDate ? ` — ${draft.updatedAt.toDate().toLocaleDateString('pt-BR')}` : ''}</option>
                      ))}
                    </select>
                  )}
                  <textarea
                    id="clinical-notes-field"
                    name="notes"
                    value={formValues.notes}
                    onChange={handleChange}
                    placeholder="Descreva as atividades, progresso e comportamento do paciente durante a sessão..."
                    rows={isNotesExpanded ? 22 : 5}
                    className={`w-full resize-y rounded-xl border border-noble-300 !bg-white px-4 py-3 text-sm leading-7 !text-black shadow-inner focus:outline-none focus:ring-2 focus:ring-plum-400 dark:border-noble-600 dark:!bg-noble-900 dark:!text-white ${
                      isNotesExpanded ? 'min-h-[55vh]' : 'min-h-36 max-h-[60vh]'
                    }`}
                    required
                  />
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <button type="button" onClick={handleCopyEvolutionNotes} disabled={!formValues.notes} className="rounded-xl border border-noble-300 px-3 py-2 text-xs font-bold text-noble-700 hover:bg-noble-50 disabled:opacity-50 dark:border-noble-700 dark:text-noble-200 dark:hover:bg-noble-800">Copiar texto</button>
                    <button type="button" onClick={persistEvolutionDraft} disabled={savingDraft || !formValues.notes} className="rounded-xl bg-plum-600 px-3 py-2 text-xs font-bold text-white hover:bg-plum-700 disabled:opacity-50">{savingDraft ? 'Salvando...' : selectedDraftId ? 'Salvar alterações' : 'Salvar rascunho'}</button>
                    <button type="button" onClick={handlePrintEvolutionDraft} disabled={savingDraft || !formValues.notes} className="rounded-xl bg-green-600 px-3 py-2 text-xs font-bold text-white hover:bg-green-700 disabled:opacity-50">Gerar PDF</button>
                  </div>
                  {!isNotesExpanded && <p className="text-[11px] text-noble-500 dark:text-noble-400">Use “Ampliar” para revisar em tela cheia ou arraste o canto inferior direito.</p>}
                </div>

                {therapeuticPlan?.objectives?.length > 0 && (
                  <div className="rounded-xl border border-plum-200 bg-plum-50/40 p-4 dark:border-plum-800 dark:bg-noble-800">
                    <h5 className="text-sm font-bold text-noble-800 dark:text-white">Objetivos trabalhados nesta sessão</h5>
                    <p className="mb-3 mt-1 text-[11px] text-noble-500 dark:text-noble-300">Selecione os objetivos e registre o desempenho observado.</p>
                    <div className="space-y-3">
                      {therapeuticPlan.objectives.filter((objective) => objective.status !== 'Suspenso').map((objective) => {
                        const progress = objectiveProgress.find((item) => item.objectiveId === objective.id)
                        return (
                          <div key={objective.id} className="rounded-xl border border-noble-200 bg-white p-3 dark:border-noble-700 dark:bg-noble-900">
                            <label className="flex cursor-pointer items-start gap-2">
                              <input type="checkbox" checked={!!progress} onChange={() => toggleObjectiveProgress(objective)} className="mt-1 h-4 w-4 rounded text-plum-600" />
                              <span><span className="block text-xs font-bold text-noble-800 dark:text-white">{objective.description}</span><span className="text-[10px] text-plum-600 dark:text-plum-300">{objective.area} • {objective.status}</span></span>
                            </label>
                            {progress && (
                              <div className="mt-3 grid grid-cols-1 gap-2">
                                <textarea value={progress.performance} onChange={(event) => updateObjectiveProgress(objective.id, 'performance', event.target.value)} rows={2} placeholder="Desempenho, percentual de acerto, nível de ajuda ou resposta clínica..." className="w-full rounded-lg border border-noble-300 bg-white px-3 py-2 text-xs text-noble-800 dark:border-noble-700 dark:bg-noble-800 dark:text-white" />
                                <select value={progress.status} onChange={(event) => updateObjectiveProgress(objective.id, 'status', event.target.value)} className="rounded-lg border border-noble-300 bg-white px-3 py-2 text-xs text-noble-800 dark:border-noble-700 dark:bg-noble-800 dark:text-white">{objectiveStatuses.map((status) => <option key={status}>{status}</option>)}</select>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                <label
                  htmlFor="incrementSession"
                  className="flex cursor-pointer items-start gap-3 rounded-xl border-2 border-noble-300 bg-white p-4 shadow-sm transition hover:border-plum-400 hover:bg-plum-50/40 dark:border-noble-600 dark:bg-noble-800 dark:hover:border-plum-500 dark:hover:bg-noble-750"
                >
                  <input
                    type="checkbox"
                    id="incrementSession"
                    name="incrementSession"
                    checked={formValues.incrementSession}
                    onChange={handleChange}
                    disabled={!!linkedSchedule}
                    aria-describedby="increment-session-description"
                    className="mt-0.5 h-5 w-5 shrink-0 rounded border-2 border-noble-400 bg-white text-plum-600 focus:ring-2 focus:ring-plum-500 focus:ring-offset-2 dark:border-noble-500 dark:bg-noble-900 dark:ring-offset-noble-800"
                  />
                  <span className="flex flex-col gap-1">
                    <span className="text-sm font-bold leading-5 text-noble-900 dark:text-white">
                      Contabilizar esta evolução como uma sessão realizada
                    </span>
                    <span
                      id="increment-session-description"
                      className="text-xs font-medium leading-5 text-noble-600 dark:text-noble-300"
                    >
                      Quando marcada, soma +1 às sessões realizadas e reduz automaticamente o saldo do paciente.
                      {linkedSchedule && ' Este atendimento está vinculado à agenda e será contabilizado automaticamente.'}
                    </span>
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={loadingSubmit}
                  className="w-full rounded-xl bg-plum-600 py-3 text-sm font-semibold text-white transition hover:bg-plum-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loadingSubmit ? 'Registrando...' : 'Registrar Evolução'}
                </button>
              </form>
            </div>

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

              {evolutions.length > 0 && (
                <div className="mb-4 space-y-3 rounded-xl border border-noble-200 bg-noble-50 p-3 dark:border-noble-800 dark:bg-noble-900">
                  <input
                    type="search"
                    value={historyFilters.search}
                    onChange={(event) => setHistoryFilters((filters) => ({ ...filters, search: event.target.value }))}
                    placeholder="Pesquisar nas anotações..."
                    className="w-full rounded-lg border border-noble-300 bg-white px-3 py-2 text-xs text-noble-800 focus:outline-none focus:ring-2 focus:ring-plum-300 dark:border-noble-700 dark:bg-noble-800 dark:text-white"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <label className="text-[10px] font-semibold text-noble-600 dark:text-noble-300">
                      De
                      <input type="date" value={historyFilters.dateFrom} onChange={(event) => setHistoryFilters((filters) => ({ ...filters, dateFrom: event.target.value }))} className="mt-1 w-full rounded-lg border border-noble-300 bg-white px-2 py-1.5 text-xs dark:border-noble-700 dark:bg-noble-800" />
                    </label>
                    <label className="text-[10px] font-semibold text-noble-600 dark:text-noble-300">
                      Até
                      <input type="date" value={historyFilters.dateTo} onChange={(event) => setHistoryFilters((filters) => ({ ...filters, dateTo: event.target.value }))} className="mt-1 w-full rounded-lg border border-noble-300 bg-white px-2 py-1.5 text-xs dark:border-noble-700 dark:bg-noble-800" />
                    </label>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-noble-500 dark:text-noble-400">
                    <span>{filteredEvolutions.length} registro(s) encontrado(s)</span>
                    <button type="button" onClick={() => { setHistoryFilters({ search: '', dateFrom: '', dateTo: '' }); setSelectedEvolutionIds([]) }} className="font-bold text-plum-600 hover:underline dark:text-plum-400">Limpar filtros</button>
                  </div>
                  <button
                    type="button"
                    onClick={handlePrintFilteredEvolutions}
                    disabled={selectedEvolutionIds.length === 0 && !historyFilters.dateFrom && !historyFilters.dateTo}
                    className="w-full rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {selectedEvolutionIds.length > 0
                      ? `Gerar PDF de ${selectedEvolutionIds.length} selecionado(s)`
                      : 'Gerar PDF do período'}
                  </button>
                </div>
              )}

              {savedProgressAnalyses.length > 0 && (
                <label className="mb-4 flex flex-col gap-1 text-xs font-bold text-noble-700 dark:text-noble-200">
                  Pareceres salvos
                  <select
                    value={savedAnalysisId}
                    onChange={(event) => {
                      const analysis = savedProgressAnalyses.find((item) => item.id === event.target.value)
                      setSavedAnalysisId(event.target.value)
                      if (analysis) setAiProgressAnalysis(analysis.text || '')
                    }}
                    className="rounded-lg border border-noble-300 bg-white px-3 py-2 text-sm font-normal text-noble-800 dark:border-noble-700 dark:bg-noble-800 dark:text-white"
                  >
                    <option value="">Selecione um parecer salvo</option>
                    {savedProgressAnalyses.map((analysis, index) => (
                      <option key={analysis.id} value={analysis.id}>
                        Parecer {savedProgressAnalyses.length - index}{analysis.updatedAt?.toDate ? ` — ${analysis.updatedAt.toDate().toLocaleDateString('pt-BR')}` : ''}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {aiProgressAnalysis && (
                <div className={`rounded-2xl border-2 border-plum-300 bg-white p-5 shadow-xl dark:border-plum-700 dark:bg-noble-900 ${isAnalysisExpanded ? 'fixed inset-4 z-[70] overflow-y-auto md:inset-10' : 'relative mb-4'}`}>
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-noble-200 pb-3 dark:border-noble-700">
                    <div>
                      <h5 className="text-base font-extrabold text-plum-800 dark:text-plum-200">Parecer de Progresso com IA</h5>
                      <p className="mt-1 text-xs text-noble-500 dark:text-noble-400">Revise e edite o conteúdo antes de salvar ou emitir o PDF.</p>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setIsAnalysisExpanded((expanded) => !expanded)} className="rounded-lg border border-noble-300 px-3 py-1.5 text-xs font-bold text-noble-700 hover:bg-noble-50 dark:border-noble-700 dark:text-noble-200 dark:hover:bg-noble-800">{isAnalysisExpanded ? 'Reduzir' : 'Ampliar'}</button>
                      <button type="button" onClick={() => { setAiProgressAnalysis(''); setSavedAnalysisId(''); setIsAnalysisExpanded(false) }} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/20">Fechar</button>
                    </div>
                  </div>
                  <textarea
                    value={aiProgressAnalysis}
                    onChange={(event) => setAiProgressAnalysis(event.target.value)}
                    rows={isAnalysisExpanded ? 24 : 14}
                    className={`w-full resize-y rounded-xl border border-noble-300 !bg-white p-4 font-sans text-sm leading-7 !text-black shadow-inner focus:outline-none focus:ring-2 focus:ring-plum-400 dark:border-noble-600 dark:!bg-noble-900 dark:!text-white ${isAnalysisExpanded ? 'min-h-[60vh]' : 'min-h-80'}`}
                    aria-label="Conteúdo editável do parecer de progresso"
                  />
                  <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <button type="button" onClick={handleCopyProgressAnalysis} className="rounded-xl border border-noble-300 px-4 py-2.5 text-sm font-bold text-noble-700 hover:bg-noble-50 dark:border-noble-700 dark:text-noble-200 dark:hover:bg-noble-800">Copiar texto</button>
                    <button type="button" onClick={persistProgressAnalysis} disabled={savingAnalysis} className="rounded-xl bg-plum-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-plum-700 disabled:opacity-50">{savingAnalysis ? 'Salvando...' : savedAnalysisId ? 'Salvar alterações' : 'Salvar parecer'}</button>
                    <button type="button" onClick={handlePrintProgressAnalysis} disabled={savingAnalysis} className="rounded-xl bg-green-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50">Gerar PDF</button>
                  </div>
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
              ) : filteredEvolutions.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-sm font-medium text-noble-500 dark:text-noble-400">Nenhuma evolução corresponde aos filtros.</p>
                </div>
              ) : (
                <div className="space-y-4 pr-1">
                  {filteredEvolutions.map((evol) => {
                    const [year, month, day] = evol.date.split('-')
                    const formattedDate = `${day}/${month}/${year}`

                    return (
                      <div
                        key={evol.id}
                        className={`group rounded-xl border bg-white p-4 shadow-sm transition-all duration-200 dark:bg-noble-900 ${
                          expandedEvolutionIds.includes(evol.id)
                            ? 'fixed inset-4 z-[65] overflow-y-auto border-plum-400 p-6 shadow-2xl dark:border-plum-600 md:inset-10 md:p-8'
                            : 'relative'
                        } ${selectedEvolutionIds.includes(evol.id)
                            ? 'border-green-500 ring-2 ring-green-200 dark:border-green-500 dark:ring-green-900'
                            : 'border-noble-200 hover:border-noble-300 dark:border-noble-800 dark:hover:border-noble-700'
                        }`}
                      >
                        <div className="absolute right-3 top-3 flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100">
                          <button type="button" onClick={() => openRevisionModal(evol)} className="text-xs font-semibold text-plum-600 hover:underline dark:text-plum-400">Retificar</button>
                          {!(evol.revisionCount > 0) && <button type="button" onClick={() => handleDelete(evol)} className="text-xs text-red-500 hover:underline">Excluir</button>}
                        </div>
                        <label className="mb-2 flex cursor-pointer flex-wrap items-center gap-2 pr-28">
                          <input
                            type="checkbox"
                            name="selectedEvolution"
                            value={evol.id}
                            checked={selectedEvolutionIds.includes(evol.id)}
                            onChange={() => setSelectedEvolutionIds((ids) => ids.includes(evol.id) ? ids.filter((id) => id !== evol.id) : [...ids, evol.id])}
                            className="h-4 w-4 border-noble-300 text-green-600 focus:ring-green-500"
                          />
                          <span className="rounded bg-noble-100 dark:bg-noble-800 px-2 py-0.5 text-xs font-semibold text-noble-600 dark:text-noble-300">
                            {formattedDate}
                          </span>
                          <span className="text-xs text-noble-500 dark:text-noble-400">
                            {evol.duration} min
                          </span>
                          <span className="text-xs font-semibold text-green-700 dark:text-green-400">
                            {evol.scheduleId ? 'Agenda' : 'Manual'}
                          </span>
                          {evol.revisionCount > 0 && <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">Retificado {evol.revisionCount}x</span>}
                        </label>
                        <p className={`whitespace-pre-wrap font-sans text-noble-700 dark:text-noble-200 ${expandedEvolutionIds.includes(evol.id) ? 'mt-6 text-base leading-8 md:text-lg md:leading-9' : 'max-h-24 overflow-hidden text-sm leading-relaxed'}`}>{evol.notes}</p>
                        <button
                          type="button"
                          onClick={() => setExpandedEvolutionIds((ids) => ids.includes(evol.id) ? ids.filter((id) => id !== evol.id) : [...ids, evol.id])}
                          className="mt-2 text-[11px] font-bold text-plum-600 hover:underline dark:text-plum-400"
                        >
                          {expandedEvolutionIds.includes(evol.id) ? 'Recolher' : 'Expandir'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'anamnesis' && (
          <div className="flex-1 overflow-y-auto">
            {loadingAnamnesis ? (
              <div className="flex flex-1 items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-plum-200 border-t-plum-600" />
              </div>
            ) : (
              <form onSubmit={handleSaveAnamnesisForm} className="space-y-4 pb-6">
                <div>
                  <h4 className="mb-1 text-base font-bold text-noble-800 dark:text-noble-100">Avaliação e Anamnese</h4>
                  <p className="text-xs text-noble-500 dark:text-noble-400">Preencha somente as informações pertinentes. Abra cada seção para organizar a entrevista.</p>
                </div>

                <AnamnesisSection title="1. Entrevista, encaminhamento e prioridades" description="Identifique a origem das informações e as prioridades do paciente ou família." open>
                  <InputField label="Data da entrevista" type="date" name="interviewDate" value={anamnesisValues.interviewDate} onChange={handleAnamnesisChange} />
                  <InputField label="Nome do informante" name="informant" value={anamnesisValues.informant} onChange={handleAnamnesisChange} placeholder="Paciente, responsável ou cuidador" />
                  <InputField label="Relação com o paciente" name="informantRelationship" value={anamnesisValues.informantRelationship} onChange={handleAnamnesisChange} placeholder="Ex.: mãe, pai, cuidador ou o próprio paciente" />
                  <InputField label="Origem do encaminhamento" name="referralSource" value={anamnesisValues.referralSource} onChange={handleAnamnesisChange} placeholder="Profissional, escola, serviço ou demanda espontânea" />
                  <div className="md:col-span-2"><InputField label="Queixa principal / motivo da consulta" type="textarea" rows={4} name="complaint" value={anamnesisValues.complaint} onChange={handleAnamnesisChange} placeholder="Quando começou, como evoluiu e em quais situações ocorre?" required /></div>
                  <div className="md:col-span-2"><InputField label="Expectativas, prioridades e objetivos" type="textarea" name="familyGoals" value={anamnesisValues.familyGoals} onChange={handleAnamnesisChange} placeholder="O que o paciente ou a família espera alcançar?" /></div>
                </AnamnesisSection>

                <AnamnesisSection title="2. Desenvolvimento e histórico de saúde" description="Gestação, nascimento, desenvolvimento, condições clínicas e antecedentes.">
                  <InputField label="Gestação, nascimento e período neonatal" type="textarea" name="pregnancyBirthHistory" value={anamnesisValues.pregnancyBirthHistory} onChange={handleAnamnesisChange} placeholder="Intercorrências, idade gestacional, parto, peso, UTI ou triagens neonatais." />
                  <InputField label="Desenvolvimento global" type="textarea" name="developmentalHistory" value={anamnesisValues.developmentalHistory} onChange={handleAnamnesisChange} placeholder="Marcos motores, cognitivos, autonomia e desenvolvimento social." />
                  <InputField label="Histórico de saúde e diagnósticos" type="textarea" name="healthHistory" value={anamnesisValues.healthHistory} onChange={handleAnamnesisChange} placeholder="Doenças, cirurgias, internações e diagnósticos atuais ou anteriores." />
                  <InputField label="Medicamentos e alergias" type="textarea" name="medicationsAllergies" value={anamnesisValues.medicationsAllergies} onChange={handleAnamnesisChange} placeholder="Medicamento, finalidade, efeitos percebidos e alergias conhecidas." />
                  <div className="md:col-span-2"><InputField label="Antecedentes familiares" type="textarea" name="familyHistory" value={anamnesisValues.familyHistory} onChange={handleAnamnesisChange} placeholder="Alterações de fala, linguagem, audição, voz, aprendizagem ou desenvolvimento." /></div>
                </AnamnesisSection>

                <AnamnesisSection title="3. Comunicação, audição e contexto" description="História comunicativa, idiomas, audição e participação na escola ou trabalho.">
                  <InputField label="Histórico auditivo e otorrinolaringológico" type="textarea" name="hearingHistory" value={anamnesisValues.hearingHistory} onChange={handleAnamnesisChange} placeholder="Triagem, audiometria, otites, cirurgias, queixas ou dispositivos." />
                  <InputField label="Desenvolvimento de fala e linguagem" type="textarea" name="speechDevelopment" value={anamnesisValues.speechDevelopment} onChange={handleAnamnesisChange} placeholder="Balbucio, primeiras palavras, frases, compreensão e inteligibilidade." />
                  <InputField label="Idiomas e formas de comunicação" type="textarea" name="languagesCommunication" value={anamnesisValues.languagesCommunication} onChange={handleAnamnesisChange} placeholder="Idiomas/dialetos, contextos de uso, gestos, Libras ou comunicação alternativa." />
                  <InputField label="Contexto escolar ou profissional" type="textarea" name="educationOccupation" value={anamnesisValues.educationOccupation} onChange={handleAnamnesisChange} placeholder="Escolaridade, alfabetização, desempenho, adaptações ou demanda profissional." />
                </AnamnesisSection>

                <AnamnesisSection title="4. Funções orofaciais, alimentação, respiração e voz" description="Preencha os itens relacionados à queixa e à faixa etária.">
                  <InputField label="Alimentação e deglutição" type="textarea" name="feedingSwallowing" value={anamnesisValues.feedingSwallowing} onChange={handleAnamnesisChange} placeholder="Amamentação, consistências, seletividade, mastigação, tosse ou engasgos." />
                  <InputField label="Motricidade orofacial e hábitos orais" type="textarea" name="oralMotorHabits" value={anamnesisValues.oralMotorHabits} onChange={handleAnamnesisChange} placeholder="Postura oral, salivação, mastigação, chupeta, mamadeira, sucção ou bruxismo." />
                  <InputField label="Respiração e sono" type="textarea" name="breathingSleep" value={anamnesisValues.breathingSleep} onChange={handleAnamnesisChange} placeholder="Respiração oral, ronco, sono agitado ou pausas respiratórias." />
                  <InputField label="Voz e demanda vocal" type="textarea" name="voiceHistory" value={anamnesisValues.voiceHistory} onChange={handleAnamnesisChange} placeholder="Rouquidão, fadiga, falhas, início, variação e uso profissional da voz." />
                </AnamnesisSection>

                <AnamnesisSection title="5. Funcionalidade, participação e rede de cuidado" description="Impactos cotidianos, apoios, barreiras e atendimentos anteriores.">
                  <InputField label="Comportamento e interação social" type="textarea" name="behavior" value={anamnesisValues.behavior} onChange={handleAnamnesisChange} placeholder="Atenção, interação, autorregulação e comportamento em diferentes ambientes." />
                  <InputField label="Impacto funcional e participação" type="textarea" name="functionalImpact" value={anamnesisValues.functionalImpact} onChange={handleAnamnesisChange} placeholder="Impacto em casa, escola, trabalho e relações; facilitadores e barreiras." />
                  <div className="md:col-span-2"><InputField label="Avaliações, terapias, exames e profissionais anteriores" type="textarea" name="previousCare" value={anamnesisValues.previousCare} onChange={handleAnamnesisChange} placeholder="Resultados, encaminhamentos e resposta aos tratamentos." /></div>
                </AnamnesisSection>

                <AnamnesisSection title="6. Segurança clínica e síntese profissional" description="Destaque intercorrências e separe o relato das observações profissionais.">
                  <div className="md:col-span-2"><InputField label="Sinais de alerta e intercorrências" type="textarea" name="warningSigns" value={anamnesisValues.warningSigns} onChange={handleAnamnesisChange} placeholder="Ex.: perda súbita de habilidades, engasgos, falta de ar, perda de peso ou piora progressiva." /></div>
                  <div className="md:col-span-2"><InputField label="Observações clínicas, condutas e encaminhamentos" type="textarea" rows={5} name="clinicalNotes" value={anamnesisValues.clinicalNotes} onChange={handleAnamnesisChange} placeholder="Observações do profissional, condutas e encaminhamentos iniciais." /></div>
                </AnamnesisSection>

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

        {activeTab === 'plan' && (
          <div className="flex-1 overflow-y-auto">
            <TherapeuticPlanTab
              patient={patient}
              plan={therapeuticPlan}
              loading={loadingTherapeuticPlan}
            />
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="flex-1 overflow-y-auto">
            <DocumentsTab patient={patient} />
          </div>
        )}
      </div>
      {editingEvolution && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className={`max-h-[94vh] w-full overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-noble-900 ${isRevisionExpanded ? 'fixed inset-4 z-[70] md:inset-10' : 'max-w-2xl'}`}>
            <div className="mb-4 flex items-center justify-between border-b border-noble-200 pb-3 dark:border-noble-800">
              <div>
                <h4 className="text-lg font-bold text-noble-800 dark:text-white">Retificar evolução</h4>
                <p className="text-xs text-noble-500 dark:text-noble-400">A versão atual será preservada no histórico.</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setIsRevisionExpanded((expanded) => !expanded)} className="rounded-lg border border-noble-300 px-3 py-1.5 text-xs font-bold text-noble-700 hover:bg-noble-50 dark:border-noble-700 dark:text-noble-200 dark:hover:bg-noble-800">{isRevisionExpanded ? 'Reduzir' : 'Ampliar'}</button>
                <button type="button" onClick={() => { setEditingEvolution(null); setIsRevisionExpanded(false) }} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/20">Fechar</button>
              </div>
            </div>
            <form onSubmit={handleSaveRevision} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <InputField label="Data da sessão" type="date" value={revisionValues.date} onChange={(event) => setRevisionValues((values) => ({ ...values, date: event.target.value }))} required />
                <InputField label="Duração (minutos)" type="number" min={1} value={revisionValues.duration} onChange={(event) => setRevisionValues((values) => ({ ...values, duration: event.target.value }))} required />
              </div>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-bold text-noble-800 dark:text-white">Anotações clínicas corrigidas *</span>
                <textarea
                  value={revisionValues.notes}
                  onChange={(event) => setRevisionValues((values) => ({ ...values, notes: event.target.value }))}
                  rows={isRevisionExpanded ? 22 : 14}
                  className={`w-full resize-y rounded-xl border border-noble-300 !bg-white p-4 text-sm leading-7 !text-black shadow-inner focus:outline-none focus:ring-2 focus:ring-plum-400 dark:border-noble-600 dark:!bg-noble-900 dark:!text-white ${isRevisionExpanded ? 'min-h-[55vh]' : 'min-h-80'}`}
                  required
                />
              </label>
              <InputField label="Motivo da retificação" type="textarea" rows={2} value={revisionValues.reason} onChange={(event) => setRevisionValues((values) => ({ ...values, reason: event.target.value }))} placeholder="Explique por que o registro está sendo corrigido." required />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <button type="button" onClick={handleCopyRevision} className="rounded-xl border border-noble-300 px-4 py-3 text-sm font-bold text-noble-700 hover:bg-noble-50 dark:border-noble-700 dark:text-noble-200 dark:hover:bg-noble-800">Copiar texto</button>
                <button type="submit" disabled={savingRevision} className="rounded-xl bg-plum-600 px-4 py-3 text-sm font-bold text-white hover:bg-plum-700 disabled:opacity-50">{savingRevision ? 'Salvando...' : 'Salvar retificação'}</button>
                <button type="button" onClick={handleSaveRevisionAndPrint} disabled={savingRevision} className="rounded-xl bg-green-600 px-4 py-3 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50">Salvar e gerar PDF</button>
              </div>
            </form>

            <div className="mt-6 border-t border-noble-200 pt-4 dark:border-noble-800">
              <h5 className="text-sm font-bold text-noble-800 dark:text-white">Versões anteriores</h5>
              {loadingRevisions ? (
                <p className="mt-3 text-xs text-noble-500">Carregando histórico...</p>
              ) : revisionHistory.length === 0 ? (
                <p className="mt-3 text-xs text-noble-500">Este registro ainda não possui retificações anteriores.</p>
              ) : (
                <div className="mt-3 space-y-3">
                  {revisionHistory.map((revision) => (
                    <details key={revision.id} className="rounded-xl border border-noble-200 p-3 dark:border-noble-700">
                      <summary className="cursor-pointer text-xs font-bold text-noble-700 dark:text-noble-200">
                        Versão de {revision.date?.split('-').reverse().join('/')} — motivo: {revision.reason}
                      </summary>
                      <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-noble-600 dark:text-noble-300">{revision.notes}</p>
                      <p className="mt-2 text-[10px] text-noble-400">Duração registrada: {revision.duration} minutos</p>
                    </details>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <AIConsentModal
        isOpen={consentState.isOpen}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        actionLabel={consentState.actionLabel}
      />
    </div>
  )
}

export default EvolutionModal
