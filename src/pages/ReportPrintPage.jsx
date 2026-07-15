import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc, collection, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase/config'
import { getAnamnesis } from '../services/anamnesisService'

const anamnesisPrintFields = [
  ['interviewDate', 'Data da entrevista'], ['informant', 'Informante'],
  ['informantRelationship', 'Relação com o paciente'], ['referralSource', 'Origem do encaminhamento'],
  ['complaint', 'Queixa principal / motivo da consulta'], ['familyGoals', 'Expectativas, prioridades e objetivos'],
  ['pregnancyBirthHistory', 'Gestação, nascimento e período neonatal'], ['developmentalHistory', 'Desenvolvimento global'],
  ['healthHistory', 'Histórico de saúde e diagnósticos'], ['medicationsAllergies', 'Medicamentos e alergias'],
  ['familyHistory', 'Antecedentes familiares'], ['hearingHistory', 'Histórico auditivo e otorrinolaringológico'],
  ['speechDevelopment', 'Desenvolvimento de fala e linguagem'], ['languagesCommunication', 'Idiomas e formas de comunicação'],
  ['educationOccupation', 'Contexto escolar ou profissional'], ['feedingSwallowing', 'Alimentação e deglutição'],
  ['oralMotorHabits', 'Motricidade orofacial e hábitos orais'], ['breathingSleep', 'Respiração e sono'],
  ['voiceHistory', 'Voz e demanda vocal'], ['behavior', 'Comportamento e interação social'],
  ['functionalImpact', 'Impacto funcional e participação'], ['previousCare', 'Avaliações, terapias e exames anteriores'],
  ['warningSigns', 'Sinais de alerta e intercorrências'], ['clinicalNotes', 'Observações clínicas, condutas e encaminhamentos'],
]
import toast from 'react-hot-toast'

function ReportPrintPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [patient, setPatient] = useState(null)
  const [anamnesis, setAnamnesis] = useState(null)
  const [evolutions, setEvolutions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return

    const loadData = async () => {
      try {
        setLoading(true)
        
        // 1. Buscar Paciente
        const patientDoc = await getDoc(doc(db, 'patients', id))
        if (!patientDoc.exists()) {
          toast.error('Paciente não encontrado.')
          navigate('/pacientes')
          return
        }
        setPatient({ id: patientDoc.id, ...patientDoc.data() })

        // 2. Buscar Anamnese
        const anamnesisData = await getAnamnesis(id)
        if (anamnesisData) {
          setAnamnesis(anamnesisData)
        }

        // 3. Buscar Evoluções Ordenadas por Data descrescente
        const evolutionsQuery = query(
          collection(db, 'patients', id, 'evolutions'),
          orderBy('date', 'desc')
        )
        const evolutionsSnap = await getDocs(evolutionsQuery)
        const evolutionsList = evolutionsSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setEvolutions(evolutionsList)

      } catch (error) {
        console.error(error)
        toast.error('Erro ao carregar dados do prontuário.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id, navigate])

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-plum-200 border-t-plum-600" />
          <p className="text-sm font-medium text-noble-500">Gerando relatório clínico...</p>
        </div>
      </div>
    )
  }

  if (!patient) return null

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
    ageStr = `${age} anos`
  }

  return (
    <div className="min-h-screen bg-neutral-100 p-4 md:p-8 print:bg-white print:p-0">
      {/* Barra de Ações Superior (Invisível na impressão) */}
      <div className="mx-auto mb-6 flex max-w-3xl items-center justify-between rounded-xl bg-white p-4 shadow-md print:hidden">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.close()}
            className="rounded-lg border border-noble-300 px-4 py-2 text-sm font-semibold text-noble-700 hover:bg-noble-50 transition"
          >
            Fechar Aba
          </button>
          <button
            type="button"
            onClick={() => navigate('/pacientes')}
            className="rounded-lg border border-noble-300 px-4 py-2 text-sm font-semibold text-noble-700 hover:bg-noble-50 transition"
          >
            Ir para Pacientes
          </button>
        </div>
        <button
          type="button"
          onClick={handlePrint}
          className="rounded-lg bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-700 transition"
        >
          Imprimir / Salvar PDF 🖨️
        </button>
      </div>

      {/* Folha A4 Simulada */}
      <article className="mx-auto max-w-3xl bg-white p-10 shadow-lg print:shadow-none print:p-0 font-serif text-neutral-900 leading-relaxed">
        {/* Cabeçalho Timbrado */}
        <div className="border-b-2 border-neutral-300 pb-5 text-center">
          <h1 className="text-2xl font-bold uppercase tracking-wider text-neutral-800">FonoFlow</h1>
          <p className="text-sm uppercase tracking-[0.2em] text-neutral-500 mt-1">Gestão de Atendimento Fonoaudiológico Domiciliar</p>
          <h2 className="text-lg font-bold text-neutral-700 mt-4 uppercase">Relatório e Prontuário Clínico</h2>
        </div>

        {/* Dados Pessoais do Paciente */}
        <section className="mt-8">
          <h3 className="border-b border-neutral-300 pb-1 text-sm font-bold uppercase text-neutral-500">Dados do Paciente</h3>
          <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
            <div>
              <p><strong>Nome:</strong> {patient.name}</p>
              <p><strong>Nascimento:</strong> {formattedBirth} {ageStr && `(${ageStr})`}</p>
            </div>
            <div>
              <p><strong>Responsável:</strong> {patient.guardian}</p>
              <p><strong>Telefone:</strong> {patient.phone}</p>
            </div>
          </div>
        </section>

        {/* Avaliação e Anamnese */}
        {anamnesis && (
          <section className="mt-8">
            <h3 className="border-b border-neutral-300 pb-1 text-sm font-bold uppercase text-neutral-500">Anamnese e Avaliação Inicial</h3>
            <div className="mt-3 space-y-4 text-sm text-justify">
              {anamnesisPrintFields.map(([key, label]) => anamnesis[key] && (
                <div key={key} className="page-break-inside-avoid">
                  <p className="font-semibold text-neutral-850">{label}:</p>
                  <p className="mt-0.5 whitespace-pre-wrap text-neutral-700">{anamnesis[key]}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Histórico de Evoluções Clínicas */}
        <section className="mt-8 page-break-before">
          <h3 className="border-b border-neutral-300 pb-1 text-sm font-bold uppercase text-neutral-500">Histórico de Evoluções Clínicas</h3>
          <div className="mt-4 space-y-6 text-sm">
            {evolutions.length === 0 ? (
              <p className="text-neutral-500 italic">Nenhum registro de evolução encontrado para este paciente.</p>
            ) : (
              evolutions.map((evol) => {
                if (!evol.date || typeof evol.date !== 'string') {
                  return (
                    <div key={evol.id} className="border-l-2 border-neutral-300 pl-4 py-0.5 page-break-inside-avoid">
                      <p className="font-bold text-neutral-800">
                        Sessão com data não registrada <span className="text-xs font-normal text-neutral-500">({evol.duration} minutos)</span>
                      </p>
                      <p className="text-neutral-700 mt-1 text-justify whitespace-pre-wrap">{evol.notes}</p>
                    </div>
                  )
                }

                const [year, month, day] = evol.date.split('-')
                const formattedDate = `${day}/${month}/${year}`

                return (
                  <div key={evol.id} className="border-l-2 border-neutral-300 pl-4 py-0.5 page-break-inside-avoid">
                    <p className="font-bold text-neutral-800">
                      Sessão do dia {formattedDate} <span className="text-xs font-normal text-neutral-500">({evol.duration} minutos)</span>
                    </p>
                    <p className="text-neutral-700 mt-1 text-justify whitespace-pre-wrap">{evol.notes}</p>
                  </div>
                )
              })
            )}
          </div>
        </section>

        {/* Rodapé do Relatório */}
        <footer className="mt-16 border-t border-neutral-200 pt-8 text-center text-xs text-neutral-450 print:mt-24">
          <div className="mx-auto w-64 border-t border-neutral-400 mt-12 mb-2"></div>
          <p className="font-semibold uppercase tracking-wider text-neutral-700">Fonoaudiólogo(a) Responsável</p>
          <p className="text-neutral-450 mt-1">Carimbo e Assinatura</p>
          <p className="text-[10px] text-neutral-400 mt-12">Relatório gerado automaticamente em {new Date().toLocaleDateString('pt-BR')} via FonoFlow.</p>
        </footer>
      </article>
    </div>
  )
}

export default ReportPrintPage
