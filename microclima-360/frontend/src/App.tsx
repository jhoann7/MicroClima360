import { useEffect, useMemo, useState } from 'react'
import { Activity, Thermometer, Droplets, Leaf, Play, Pause, ChevronLeft, ChevronRight, Calculator, ArrowRight, RotateCcw, UploadCloud, Database, FileDown, Trash2, CalendarDays, TrendingUp, TrendingDown, Trophy, Maximize2, Minimize2, CheckCircle2, XCircle } from 'lucide-react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts'

type AreaName = 'pasto' | 'secundaria' | 'primaria'
type RecordPoint = {
  timestamp: string
  temperature: Record<AreaName, number>
  humidity: Record<AreaName, number>
  differences: { pasto_menos_secundaria: number; pasto_menos_primaria: number }
}
type Payload = { source: string; notice: string; areas: AreaName[]; matrix: number[][]; records: RecordPoint[] }
const labels: Record<AreaName, string> = { pasto: 'Pasto', secundaria: 'Floresta secundária', primaria: 'Floresta primária' }
const colors: Record<AreaName, string> = { pasto: '#f9ba60', secundaria: '#55d8bb', primaria: '#82a8ff' }
const areaNames: AreaName[] = ['pasto', 'secundaria', 'primaria']
const formatTime = (date: string) => new Date(date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })

type LabResult = { vector: number[]; matrix: number[][]; terms: number[][]; result: number[]; explanations: string[]; source: string }
const phases = ['Vetor', 'Matriz', 'Multiplicação', 'Resultado']
function Laboratory({ initial }: { initial: [number, number, number] }) {
  const [values, setValues] = useState<[number, number, number]>(initial)
  const [phase, setPhase] = useState(0)
  const [result, setResult] = useState<LabResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const names = ['Pasto', 'Floresta secundária', 'Floresta primária']
  const update = (i: number, value: number) => { setValues(v => v.map((n, j) => i === j ? value : n) as [number, number, number]); setPhase(0); setResult(null) }
  async function calculate() {
    setBusy(true); setError('')
    try {
      const response = await fetch('/api/lab/calculate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pasto: values[0], secundaria: values[1], primaria: values[2] }) })
      if (!response.ok) throw new Error('Não foi possível realizar o cálculo.')
      setResult(await response.json()); setPhase(1)
    } catch { setError('API Python indisponível. Verifique o terminal do backend.') }
    finally { setBusy(false) }
  }
  return <div className="labLayout">
    <section className="panel labIntro">
      <div className="eyebrow">LABORATÓRIO INTERATIVO · EXPERIMENTO 01</div>
      <h2>Transforme temperaturas em conhecimento.</h2>
      <p>Altere os valores e descubra como uma multiplicação de matrizes compara três ambientes de uma só vez. Você controla o experimento.</p>
      <div className="labInputs">{values.map((v, i) => <label key={i} className="labInput"><span>{names[i]}</span><strong>{v.toFixed(1)} °C</strong><input type="range" min="15" max="42" step="0.5" value={v} onChange={e => update(i, Number(e.target.value))} aria-label={'Temperatura de '+names[i]}/></label>)}</div>
      <div className="labActions"><button className="primaryButton" onClick={calculate} disabled={busy}><Sparkles size={17}/> {busy ? 'Calculando...' : 'Aplicar transformação'}</button><button className="secondaryButton" onClick={() => {setValues(initial); setResult(null); setPhase(0); setError('')}}><RotateCcw size={15}/> Restaurar</button></div>
      {error && <div className="error">{error}</div>}
      <div className="labHint">Os controles utilizam valores escolhidos pelo visitante. Não representam dados de campo.</div>
    </section>
    <section className="panel labStage">
      <div className="sectionTop"><div><div className="eyebrow">PASSO A PASSO</div><h2>Veja a Álgebra Linear acontecer</h2></div><span className="stepCounter">{phase + 1} / 4</span></div>
      <div className="phaseBar">{phases.map((p, i) => <button key={p} className={i === phase ? 'current' : ''} disabled={!result && i > 0} onClick={() => setPhase(i)}>{i+1}. {p}</button>)}</div>
      <div className="labEquation">
        <div className={'equationUnit '+(phase === 0 ? 'emphasized' : '')}><span>Vetor de temperaturas</span><div className="equationVector">[{values.map(v => v.toFixed(1)).join('  ')}]</div><small>1 linha × 3 colunas</small></div>
        <span className="equationOperator">×</span>
        <div className={'equationUnit '+(phase === 1 ? 'emphasized' : '')}><span>Matriz de transformação</span><div className="equationMatrix">{[[1,1],[-1,0],[0,-1]].map((row,i) => <div key={i}>{row.map((x,j) => <span key={j}>{x}</span>)}</div>)}</div><small>3 linhas × 2 colunas</small></div>
        <span className="equationOperator">=</span>
        <div className={'equationUnit '+(phase >= 2 ? 'emphasized' : '')}><span>Vetor de diferenças</span><div className="equationVector">{result ? `[${result.result.map(n=>n.toFixed(1)).join('  ')}]` : '[ ?  ? ]'}</div><small>1 linha × 2 colunas</small></div>
      </div>
      {phase === 0 && <p className="phaseExplain">Cada posição do vetor contém a temperatura de um ambiente. A ordem é Pasto, Secundária e Primária.</p>}
      {phase === 1 && <p className="phaseExplain">Os coeficientes 1 e −1 indicam quais temperaturas serão somadas ou subtraídas. O zero exclui o ambiente daquela comparação.</p>}
      {phase === 2 && result && <div className="calculationSteps"><div>{values[0].toFixed(1)} × 1 + {values[1].toFixed(1)} × (−1) + {values[2].toFixed(1)} × 0 = <b>{result.result[0].toFixed(1)} °C</b></div><div>{values[0].toFixed(1)} × 1 + {values[1].toFixed(1)} × 0 + {values[2].toFixed(1)} × (−1) = <b>{result.result[1].toFixed(1)} °C</b></div></div>}
      {phase === 3 && result && <div className="labResults">{result.result.map((n,i)=><div key={i}><span>{result.explanations[i]}</span><strong>{n > 0 ? '+' : ''}{n.toFixed(1)} °C</strong><small>{n > 0 ? 'Pasto mais quente' : n < 0 ? 'Pasto mais frio' : 'Mesma temperatura'}</small></div>)}</div>}
      <div className="labBottom"><span>Operação executada em Python + NumPy</span><button className="primaryButton" disabled={!result} onClick={() => setPhase(p => p === 3 ? 0 : p+1)}>{phase === 3 ? 'Recomeçar explicação' : 'Próximo passo'} <ArrowRight size={16}/></button></div>
    </section>
  </div>
}


type ChallengeQuestion = { prompt: string; options: string[]; answer: number; explanation: string; tag: string }
function Challenge({ records, onExplore }: { records: RecordPoint[]; onExplore: (timestamp: string) => void }) {
  const [question, setQuestion] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [round, setRound] = useState(0)
  const pool = useMemo(() => records.filter(r => Number.isFinite(r.temperature.pasto) && Number.isFinite(r.temperature.secundaria) && Number.isFinite(r.temperature.primaria)), [records])
  const sample = pool.length ? pool[Math.min(pool.length - 1, (Math.floor(pool.length / 3) + round * 317) % pool.length)] : null
  const second = pool.length ? pool[Math.min(pool.length - 1, (Math.floor(pool.length * 0.7) + round * 131) % pool.length)] : null
  const qs: ChallengeQuestion[] = useMemo(() => {
    if (!sample || !second) return []
    const diff = sample.differences.pasto_menos_primaria
    const diff2 = second.differences.pasto_menos_secundaria
    const f = (n: number) => n.toFixed(1).replace('.', ',')
    const date = (s: string) => s.slice(8,10)+'/'+s.slice(5,7)+'/'+s.slice(0,4)+' às '+s.slice(11,16)
    return [
      { tag:'01 · LEITURA DE DADOS', prompt:`No vetor de temperaturas de ${date(sample.timestamp)}, qual posição representa o pasto?`, options:['Primeira posição','Segunda posição','Terceira posição','Nenhuma posição'], answer:0, explanation:`O primeiro elemento do vetor representa o pasto (${f(sample.temperature.pasto)} °C). O segundo representa a floresta secundária e o terceiro, a primária.`, },
      { tag:'02 · TRANSFORMAÇÃO LINEAR', prompt:`Para ${date(sample.timestamp)}, quanto vale Pasto − Floresta primária?`, options:[`${f(diff + 2)} °C`,`${f(diff)} °C`,`${f(-diff)} °C`,`${f(diff - 2)} °C`], answer:1, explanation:`Multiplicamos [${f(sample.temperature.pasto)}, ${f(sample.temperature.secundaria)}, ${f(sample.temperature.primaria)}] pela segunda coluna [1, 0, −1]. Resultado: ${f(sample.temperature.pasto)} − ${f(sample.temperature.primaria)} = ${f(diff)} °C.`, },
      { tag:'03 · INTERPRETAÇÃO', prompt:`Em ${date(second.timestamp)}, o pasto estava mais quente ou mais frio que a floresta secundária?`, options:['Mais quente','Mais frio','Mesma temperatura','Não é possível comparar'], answer: diff2 > 0 ? 0 : diff2 < 0 ? 1 : 2, explanation:`Pasto − Secundária = ${f(diff2)} °C. Diferença positiva significa pasto mais quente; negativa, mais frio; zero, temperaturas iguais.`, },
    ]
  }, [sample, second])
  if (!sample || !second) return <section className="panel">Não há registros disponíveis para iniciar o desafio.</section>
  const current = qs[question]
  const choose = (i: number) => { if (selected !== null) return; setSelected(i); if (i === current.answer) setScore(v => v + 1) }
  const advance = () => { if (question === qs.length - 1) setFinished(true); else { setQuestion(v => v + 1); setSelected(null) } }
  const restart = () => { setRound(v => v + 1); setQuestion(0); setSelected(null); setScore(0); setFinished(false) }
  return <section className="panel challengePanel">
    <div className="challengeHeader"><div><div className="eyebrow">EXPERIÊNCIA PARA A FEIRA · ETAPA 5</div><h2>Desafio: decifre o microclima</h2><p>Três perguntas, três ambientes e dados reais. Você consegue usar a Álgebra Linear para interpretar o que os sensores registraram?</p></div><Trophy size={42} color="#f9ba60"/></div>
    {!finished ? <>
      <div className="challengeProgress"><span>Questão {question + 1} de {qs.length}</span><span>{score} ponto(s)</span></div>
      <div className="challengeTrack"><div style={{width:`${((question + (selected !== null ? 1 : 0))/qs.length)*100}%`}}/></div>
      <div className="challengeTag">{current.tag}</div><h3>{current.prompt}</h3>
      <div className="challengeOptions">{current.options.map((option,i) => <button key={i} disabled={selected !== null} className={selected === null ? '' : i === current.answer ? 'correct' : selected === i ? 'incorrect' : ''} onClick={() => choose(i)}><span className="choiceLetter">{String.fromCharCode(65+i)}</span><span>{option}</span>{selected !== null && i === current.answer && <CheckCircle2 size={20}/>} {selected === i && selected !== current.answer && <XCircle size={20}/>}</button>)}</div>
      {selected !== null && <div className="challengeFeedback" role="status"><strong>{selected === current.answer ? 'Resposta correta!' : 'Ainda não! Veja como calcular.'}</strong><p>{current.explanation}</p><button className="primaryButton" onClick={advance}>{question === qs.length-1 ? 'Ver resultado' : 'Próxima questão'} <ArrowRight size={16}/></button></div>}
      <div className="challengeSource">Fonte: {sample.timestamp.slice(0,10).split('-').reverse().join('/')} · HOBO · dados históricos reais · cálculos da API NumPy</div>
    </> : <div className="challengeFinish"><Trophy size={62} color="#f9ba60"/><div className="eyebrow">DESAFIO CONCLUÍDO</div><strong>{score} / {qs.length}</strong><h3>{score === qs.length ? 'Excelente! Você dominou o desafio.' : 'Muito bem! Cada tentativa é uma descoberta.'}</h3><p>Você explorou leituras de sensores, subtração entre ambientes e interpretação de uma transformação linear.</p><div className="challengeFinishActions"><button className="primaryButton" onClick={restart}><RotateCcw size={16}/> Jogar novamente</button><button className="secondaryButton" onClick={() => onExplore(sample.timestamp)}><Activity size={16}/> Explorar o dia nos gráficos</button></div></div>}
  </section>
}


export default function App() {
  const [page, setPage] = useState<'dashboard' | 'lab' | 'data' | 'challenge'>('dashboard')
  const [presentation, setPresentation] = useState(false)
    const [data, setData] = useState<Payload | null>(null)
  const [error, setError] = useState('')
  const [index, setIndex] = useState(0)
  const [selectedDay, setSelectedDay] = useState('')
  const [playing, setPlaying] = useState(false)
  const [importBusy, setImportBusy] = useState(false)
  const [importMessage, setImportMessage] = useState('')
  const [metric, setMetric] = useState<'temperature' | 'humidity'>('temperature')
  useEffect(() => {
    fetch('/api/measurements').then(r => { if (!r.ok) throw new Error('API indisponível'); return r.json() }).then(setData).catch(() => setError('Não foi possível carregar os dados. Se estiver executando localmente, verifique a API Python na porta 8000.'))
  }, [])
  const days = useMemo(() => [...new Set((data?.records ?? []).map(r => r.timestamp.slice(0,10)))], [data])
  const day = selectedDay && days.includes(selectedDay) ? selectedDay : (days[0] ?? '')
  const dayRecords = useMemo(() => (data?.records ?? []).filter(r => r.timestamp.startsWith(day)), [data, day])
  useEffect(() => { setIndex(0); setPlaying(false) }, [day])
  useEffect(() => {
    if (!playing || !dayRecords.length) return
    const timer = window.setInterval(() => setIndex(i => {
      if (i >= dayRecords.length - 1) { setPlaying(false); return i }
      return i + 1
    }), 160)
    return () => window.clearInterval(timer)
  }, [playing, dayRecords])
  async function reloadData() {
    const r = await fetch('/api/measurements')
    if (!r.ok) throw new Error('API indisponível')
    const payload: Payload = await r.json()
    setData(payload); setSelectedDay(''); setIndex(0); setPlaying(false); setError('')
  }
  async function importData(file?: File) {
    if (!file) return
    setImportBusy(true); setImportMessage('')
    try {
      const form = new FormData(); form.append('file', file)
      const r = await fetch('/api/data/import', { method: 'POST', body: form })
      const payload = await r.json()
      if (!r.ok) throw new Error(payload.detail || 'Falha ao importar.')
      await reloadData()
      setImportMessage(`${payload.count} registros importados com sucesso. Confira os dados no monitoramento.`)
    } catch (e) { setImportMessage(`Erro: ${e instanceof Error ? e.message : 'Falha inesperada'}`) }
    finally { setImportBusy(false) }
  }
  async function resetData() {
    setImportBusy(true); setImportMessage('')
    try {
      const r = await fetch('/api/data/import', { method: 'DELETE' })
      if (!r.ok) throw new Error('Falha ao restaurar demonstração')
      await reloadData(); setImportMessage('Dados originais do projeto restaurados.')
    } catch (e) { setImportMessage(`Erro: ${e instanceof Error ? e.message : 'Falha inesperada'}`) }
    finally { setImportBusy(false) }
  }
  const exploreTimestamp = (timestamp: string) => { setSelectedDay(timestamp.slice(0,10)); setIndex(0); setPlaying(false); setPage('dashboard') }
  const record = dayRecords[Math.min(index, Math.max(0, dayRecords.length - 1))]
  const chartData = dayRecords.map(r => ({ time: formatTime(r.timestamp), ...r[metric] }))
  const extremes = useMemo(() => {
    if (!dayRecords.length) return null
    const byDiff = [...dayRecords].sort((a,b) => a.differences.pasto_menos_primaria - b.differences.pasto_menos_primaria)
    const avg = dayRecords.reduce((sum,r) => sum+r.differences.pasto_menos_primaria,0)/dayRecords.length
    return { minimum: byDiff[0], maximum: byDiff[byDiff.length-1], mean: avg }
  }, [dayRecords])
  return <div className={'app '+(presentation ? 'presentationMode' : '')}>
    <aside className="sidebar"><div className="logo"><span className="logoIcon"><Leaf size={23}/></span><span>MicroClima <b>360°</b></span></div><div className="navTitle">EXPERIÊNCIA</div><button className={page === 'dashboard' ? 'navActive' : 'navDisabled'} onClick={() => setPage('dashboard')}><Activity size={18}/> Monitoramento</button><button className={page === 'lab' ? 'navActive' : 'navDisabled'} onClick={() => setPage('lab')}><Calculator size={18}/> Laboratório matricial</button><button className={page === 'challenge' ? 'navActive' : 'navDisabled'} onClick={() => setPage('challenge')}><Trophy size={18}/> Desafio da feira</button><button className={page === 'data' ? 'navActive' : 'navDisabled'} onClick={() => setPage('data')}><Database size={18}/> Importar dados</button><div className="sidebarBottom">Álgebra Linear + Sensores<br/><small>Projeto acadêmico • UFRA</small></div></aside>
    <main className="main">
      <header><div><div className="eyebrow">EXPLORAÇÃO AMBIENTAL INTERATIVA</div><h1>{page === 'dashboard' ? <>Três ambientes. <span>Uma nova perspectiva.</span></> : page === 'lab' ? <>Laboratório <span>de Álgebra Linear.</span></> : page === 'challenge' ? <>Desafio <span>da feira.</span></> : <>Seus dados. <span>Nossa matemática.</span></>}</h1><p>{page === 'dashboard' ? 'Explore como as temperaturas e a umidade variam entre pasto, floresta secundária e floresta primária.' : page === 'lab' ? 'Experimente vetores, matrizes e transformações lineares com uma visualização passo a passo.' : page === 'challenge' ? 'Teste seus conhecimentos com perguntas construídas a partir de medições reais.' : 'Importe registros sincronizados dos sensores para explorar o microclima com dados de campo.'}</p></div><div className="headerActions"><button className="secondaryButton" onClick={() => setPresentation(v => !v)}>{presentation ? <Minimize2 size={16}/> : <Maximize2 size={16}/>} {presentation ? "Sair do modo feira" : "Modo feira"}</button><div className="pill"><span className="dot"/> DADOS HISTÓRICOS</div></div></header>
      <div className="notice">{data?.source === 'uploaded_csv' ? '✓ CSV importado pelo usuário. Verifique procedência e qualidade.' : data?.source === 'field_data' ? '✓ Dados reais sincronizados dos sensores HOBO · 12/08 a 10/09/2026 · horário das planilhas' : '⚠ Dados sintéticos de demonstração.'}</div>
      {error && <div className="error">{error}</div>}
      {!data && !error && <div className="loading">Carregando dados do Python...</div>}
      {page === 'data' && <section className="panel importPanel">
        <div className="eyebrow">ETAPA 3 · DADOS AMBIENTAIS</div><h2>Conecte os registros dos seus sensores</h2>
        <p>Utilize um CSV já tratado, com horários sincronizados entre pasto, floresta secundária e floresta primária. A importação é temporária e não altera o conjunto de dados original. Na hospedagem online, os dados importados podem ser perdidos entre solicitações.</p>
        <div className="importGrid"><div className="importDrop"><UploadCloud size={38}/><h2>Selecione seu CSV</h2><p>Formato CSV UTF-8, até 3 MB e 10.000 registros. Horários em ordem crescente.</p><label className="primaryButton">{importBusy ? 'Processando...' : 'Escolher arquivo'}<input type="file" accept=".csv,text/csv" disabled={importBusy} onChange={e => {void importData(e.target.files?.[0]); e.target.value = ''}} hidden/></label></div>
        <div className="importInfo"><h2>Estrutura necessária</h2><code>timestamp, temp_pasto, temp_secundaria, temp_primaria, rh_pasto, rh_secundaria, rh_primaria</code><p>Use datas ISO sem fuso (AAAA-MM-DDTHH:MM:SS), temperaturas em °C e umidade relativa em %. Os registros devem estar alinhados e no mesmo fuso antes da importação.</p><a className="secondaryButton" href="/modelo_microclima.csv" download><FileDown size={16}/> Baixar modelo CSV</a></div></div>
        {importMessage && <div className="importMessage" role="status">{importMessage}</div>}
        <div className="importFooter"><span>Fonte ativa: <b>{data?.source === 'uploaded_csv' ? 'CSV importado' : data?.source === 'field_data' ? 'Sensores HOBO reais' : 'Demonstração sintética'}</b> · {data?.records.length ?? 0} registros</span><button className="secondaryButton" disabled={importBusy || data?.source !== 'uploaded_csv'} onClick={() => void resetData()}><Trash2 size={15}/> Restaurar dados originais</button></div>
      </section>}
      {page === 'challenge' && data && <Challenge records={data.records} onExplore={exploreTimestamp}/>}
      {page === 'lab' && <Laboratory key={record?.timestamp ?? 'demo'} initial={record ? [record.temperature.pasto, record.temperature.secundaria, record.temperature.primaria] : [34,30,27]}/>}
      {page === 'dashboard' && record && <>
        <section className="cards">{areaNames.map(a => <div className="envCard" key={a} style={{'--accent': colors[a]} as React.CSSProperties}><div className="cardTop"><span className="tag">{labels[a]}</span><Thermometer size={18} color={colors[a]}/></div><div className="temp">{record.temperature[a].toFixed(1)}<span>°C</span></div><div className="humidity"><Droplets size={15}/> Umidade relativa <strong>{record.humidity[a].toFixed(1)}%</strong></div><div className="cardBar"/></div>)}</section>
        <section className="timeline panel"><div className="sectionTop"><div><div className="eyebrow">EXPLORADOR MICROCLIMÁTICO · ETAPA 4</div><h2>Viaje por um dia real de medições</h2></div><div className="clock">{formatTime(record.timestamp)}</div></div>
          <div className="dayPicker"><label htmlFor="day-select"><CalendarDays size={17}/> Dia da observação</label><select id="day-select" value={day} onChange={e => setSelectedDay(e.target.value)}>{days.map(d=><option key={d} value={d}>{d.split('-').reverse().join('/')}</option>)}</select><span>{dayRecords.length} registros disponíveis neste dia</span></div>
          <div className="controls"><button className="round" onClick={() => setIndex(i => Math.max(0,i-1))} aria-label="Anterior"><ChevronLeft size={19}/></button><button className="play" onClick={() => {if(index===dayRecords.length-1) setIndex(0);setPlaying(p => !p)}}>{playing ? <Pause size={18}/> : <Play size={18}/>} {playing ? 'Pausar' : 'Reproduzir'}</button><input aria-label="Horário" type="range" min={0} max={Math.max(0,dayRecords.length-1)} value={Math.min(index,dayRecords.length-1)} onChange={e => {setPlaying(false);setIndex(Number(e.target.value))}}/><button className="round" onClick={() => setIndex(i => Math.min(dayRecords.length-1,i+1))} aria-label="Próximo"><ChevronRight size={19}/></button></div><div className="rangeLabels"><span>{formatTime(dayRecords[0].timestamp)}</span><span>{day.split('-').reverse().join('/')}</span><span>{formatTime(dayRecords[dayRecords.length-1].timestamp)}</span></div>
        </section>
        {extremes && <section className="insights"><div className="insight"><div><TrendingUp size={18}/> Maior diferença · Pasto − Primária</div><strong>{extremes.maximum.differences.pasto_menos_primaria.toFixed(2)} °C</strong><small>{formatTime(extremes.maximum.timestamp)} · {day.split('-').reverse().join('/')}</small><button onClick={()=>{setPlaying(false);setIndex(dayRecords.indexOf(extremes.maximum))}}>Ir para horário <ArrowRight size={14}/></button></div><div className="insight"><div><TrendingDown size={18}/> Menor diferença · Pasto − Primária</div><strong>{extremes.minimum.differences.pasto_menos_primaria.toFixed(2)} °C</strong><small>{formatTime(extremes.minimum.timestamp)} · {day.split('-').reverse().join('/')}</small><button onClick={()=>{setPlaying(false);setIndex(dayRecords.indexOf(extremes.minimum))}}>Ir para horário <ArrowRight size={14}/></button></div><div className="insight"><div><Activity size={18}/> Diferença média do dia</div><strong>{extremes.mean.toFixed(2)} °C</strong><small>Média de {dayRecords.length} diferenças simultâneas</small><span className="insightNote">Calculada com os resultados matriciais</span></div></section>}
        <div className="lower"><section className="panel graphPanel"><div className="sectionTop"><div><div className="eyebrow">COMPORTAMENTO TEMPORAL</div><h2>Comparação entre ambientes</h2></div><div className="toggle"><button className={metric==='temperature'?'selected':''} onClick={()=>setMetric('temperature')}>Temperatura</button><button className={metric==='humidity'?'selected':''} onClick={()=>setMetric('humidity')}>Umidade</button></div></div><div className="chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{top:15,right:8,left:-22,bottom:0}}><defs>{areaNames.map(a=><linearGradient id={'grad-'+a} x1="0" y1="0" x2="0" y2="1" key={a}><stop offset="0%" stopColor={colors[a]} stopOpacity={0.18}/><stop offset="100%" stopColor={colors[a]} stopOpacity={0}/></linearGradient>)}</defs><CartesianGrid stroke="#233347" strokeDasharray="3 5" vertical={false}/><XAxis dataKey="time" stroke="#8b9db1" fontSize={11} interval={7}/><YAxis stroke="#8b9db1" fontSize={11} domain={['auto','auto']}/><Tooltip contentStyle={{background:'#132236',border:'1px solid #32465d',borderRadius:12,color:'#e9f1fa'}}/><Legend wrapperStyle={{fontSize:12}} formatter={(v)=>labels[v as AreaName]}/>{areaNames.map(a=><Area key={a} type="monotone" dataKey={a} stroke={colors[a]} fill={'url(#grad-'+a+')'} strokeWidth={2.5} dot={false}/>)}</AreaChart></ResponsiveContainer></div></section>
        <section className="panel mathPanel"><div className="eyebrow">ÁLGEBRA LINEAR EM AÇÃO</div><h2>A matemática por trás dos dados</h2><p>Uma transformação linear calcula simultaneamente a diferença de temperatura entre o pasto e cada floresta.</p><div className="matrixLabels">Vetor de temperaturas (°C)</div><div className="vector">[{record.temperature.pasto.toFixed(1)} &nbsp; {record.temperature.secundaria.toFixed(1)} &nbsp; {record.temperature.primaria.toFixed(1)}]</div><div className="matrixLabels">Matriz de transformação</div><div className="matrix">[ 1&nbsp;&nbsp; 1 ]<br/>[-1&nbsp;&nbsp; 0 ]<br/>[ 0&nbsp; -1 ]</div><div className="result"><span>Pasto − secundária</span><strong>{record.differences.pasto_menos_secundaria.toFixed(1)} °C</strong></div><div className="result"><span>Pasto − primária</span><strong>{record.differences.pasto_menos_primaria.toFixed(1)} °C</strong></div><small>Diferenças calculadas na API Python com NumPy.</small></section></div>
      </>}
      <footer>MicroClima 360° · Protótipo v0.5 · Desafio da Feira · Dados reais e CSV</footer>
    </main>
  </div>
}
