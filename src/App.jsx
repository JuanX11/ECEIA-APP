import React, { useEffect, useMemo, useRef, useState } from 'react'

const STORAGE_KEY = 'asistencia-data-v1'

function useLocalData(){
  const [data, setData] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if(saved){
      try { return JSON.parse(saved) } catch {}
    }
    return {
      miembros: [],       // {id, nombre, codigo?, rol?}
      sesiones: [],       // {id, fechaISO, tema}
      asistencias: {}     // {sesionId: { miembroId: { presente: true, nota?: string } } }
    }
  })
  useEffect(()=>{
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  },[data])
  return [data, setData]
}

const uid = () => crypto.randomUUID()

function App(){
  const [data, setData] = useLocalData()
  const [tab, setTab] = useState('tomar') // tomar | miembros | sesiones | reportes | ajustes
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstall, setShowInstall] = useState(false)

  useEffect(()=>{
    const onBeforeInstall = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstall(true)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall)
  },[])

  const miembrosOrdenados = useMemo(
    () => [...data.miembros].sort((a,b)=>a.nombre.localeCompare(b.nombre,'es')),
    [data.miembros]
  )

  const [sesionActivaId, setSesionActivaId] = useState(()=>data.sesiones.at(-1)?.id ?? null)
  useEffect(()=>{
    if(sesionActivaId==null && data.sesiones.length>0) setSesionActivaId(data.sesiones.at(-1).id)
  },[data.sesiones])

  const tomarAsistencia = (miembroId, presente) => {
    if(!sesionActivaId) return
    setData(prev => {
      const s = structuredClone(prev)
      if(!s.asistencias[sesionActivaId]) s.asistencias[sesionActivaId] = {}
      if(!s.asistencias[sesionActivaId][miembroId]) s.asistencias[sesionActivaId][miembroId] = { presente: false }
      s.asistencias[sesionActivaId][miembroId].presente = !!presente
      return s
    })
  }

  const setNota = (miembroId, nota) => {
    if(!sesionActivaId) return
    setData(prev => {
      const s = structuredClone(prev)
      if(!s.asistencias[sesionActivaId]) s.asistencias[sesionActivaId] = {}
      if(!s.asistencias[sesionActivaId][miembroId]) s.asistencias[sesionActivaId][miembroId] = { presente: false }
      s.asistencias[sesionActivaId][miembroId].nota = nota
      return s
    })
  }

  const crearMiembro = (m) => setData(prev => ({...prev, miembros: [...prev.miembros, {...m, id: uid()}]}))
  const borrarMiembro = (id) => setData(prev => ({...prev, miembros: prev.miembros.filter(m=>m.id!==id)}))
  const crearSesion = (s) => {
    const sesion = { ...s, id: uid() }
    setData(prev => ({...prev, sesiones: [...prev.sesiones, sesion]}))
    setSesionActivaId(sesion.id)
  }
  const borrarSesion = (id) => setData(prev => {
    const copy = structuredClone(prev)
    copy.sesiones = copy.sesiones.filter(s=>s.id!==id)
    delete copy.asistencias[id]
    if(id===sesionActivaId) setSesionActivaId(copy.sesiones.at(-1)?.id ?? null)
    return copy
  })

  const exportCSV = () => {
    // CSV por sesión con miembros por filas
    const lines = []
    for(const sesion of data.sesiones){
      lines.push(`Sesion,${sesion.tema},${new Date(sesion.fechaISO).toLocaleString()}`)
      lines.push('Nombre,Código/Rol,Presente,Nota')
      for(const m of miembrosOrdenados){
        const reg = data.asistencias[sesion.id]?.[m.id]
        lines.push([
          csv(m.nombre),
          csv(m.codigo || m.rol || ''),
          reg?.presente ? 'Sí' : 'No',
          csv(reg?.nota || '')
        ].join(','))
      }
      lines.push('') // blank line between sessions
    }
    const blob = new Blob([lines.join('\n')], {type: 'text/csv;charset=utf-8;'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'asistencia.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const importJSON = (file) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const obj = JSON.parse(reader.result)
        if(obj?.miembros && obj?.sesiones && obj?.asistencias){
          localStorage.setItem('BACKUP_'+STORAGE_KEY, localStorage.getItem(STORAGE_KEY) || '')
          setData(obj)
          alert('Datos importados 👍')
        } else {
          alert('Archivo inválido')
        }
      } catch (e){
        alert('No se pudo leer el archivo')
      }
    }
    reader.readAsText(file)
  }

  const exportBackup = () => {
    const blob = new Blob([localStorage.getItem(STORAGE_KEY) || '{}'], {type:'application/json'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'backup-asistencia.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const sesionActiva = data.sesiones.find(s=>s.id===sesionActivaId) || null
  const presentes = useMemo(()=>{
    if(!sesionActiva) return 0
    const map = data.asistencias[sesionActiva.id] || {}
    return Object.values(map).filter(r=>r.presente).length
  },[data.asistencias, sesionActivaId])

  const handleInstall = async () => {
    if(!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if(outcome) setShowInstall(false)
  }

  return (
    <div className="container">
      <header>
        <h1>📋 Asistencia Semillero</h1>
        <div className="row">
          <button className="ghost" onClick={exportBackup}>⬇️ Backup</button>
          <label className="pill" title="Importar backup JSON">
            ⬆️ Importar
            <input type="file" accept="application/json" onChange={e=>e.target.files[0] && importJSON(e.target.files[0])} style={{display:'none'}}/>
          </label>
          <button className="primary" onClick={exportCSV}>📄 Exportar CSV</button>
        </div>
      </header>

      {showInstall && (
        <div className="install-banner">
          <span>Instala esta app en tu teléfono para usarla como una app nativa.</span>
          <button className="primary" onClick={handleInstall}>Instalar</button>
          <button className="ghost" onClick={()=>setShowInstall(false)}>Cerrar</button>
        </div>
      )}

      <nav className="row card">
        {['tomar','miembros','sesiones','reportes','ajustes'].map(k => (
          <button key={k} className={k===tab?'primary':''} onClick={()=>setTab(k)}>{labelTab(k)}</button>
        ))}
      </nav>

      {tab==='tomar' && (
        <section className="app">
          <div className="card">
            <div className="row" style={{justifyContent:'space-between', alignItems:'center'}}>
              <strong>Sesión activa</strong>
              <select value={sesionActivaId ?? ''} onChange={e=>setSesionActivaId(e.target.value)}>
                <option value="" disabled>Elegir sesión…</option>
                {data.sesiones.map(s=> (
                  <option key={s.id} value={s.id}>
                    {new Date(s.fechaISO).toLocaleDateString()} — {s.tema}
                  </option>
                ))}
              </select>
            </div>
            {!sesionActiva && <p className="tag">Crea una sesión en la pestaña “Sesiones”.</p>}
            {sesionActiva && (
              <div className="grid">
                {miembrosOrdenados.map(m => {
                  const reg = (data.asistencias[sesionActivaId]||{})[m.id]
                  const presente = !!reg?.presente
                  return (
                    <div key={m.id} className="card" style={{padding:'12px'}}>
                      <div className="row" style={{justifyContent:'space-between', alignItems:'center'}}>
                        <div>
                          <div style={{fontWeight:600}}>{m.nombre}</div>
                          <div className="tag">{m.codigo || m.rol || 'Miembro'}</div>
                        </div>
                        <div className="row">
                          <button onClick={()=>tomarAsistencia(m.id, true)} className={presente?'primary':''}>✅ Presente</button>
                          <button onClick={()=>tomarAsistencia(m.id, false)} className={!presente?'ghost':'ghost'}>❌ Ausente</button>
                        </div>
                      </div>
                      <textarea placeholder="Nota (opcional)"
                        value={reg?.nota || ''}
                        onChange={(e)=>setNota(m.id, e.target.value)}
                        rows={2} style={{width:'100%', marginTop:8}}/>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          {sesionActiva && (
            <div className="card">
              <strong>Resumen rápido</strong>
              <div className="row" style={{marginTop:8}}>
                <span className="pill">🧑‍🤝‍🧑 Miembros: {miembrosOrdenados.length}</span>
                <span className="pill">✅ Presentes: {presentes}</span>
                <span className="pill">❌ Ausentes: {Math.max(0, miembrosOrdenados.length - presentes)}</span>
              </div>
            </div>
          )}
        </section>
      )}

      {tab==='miembros' && <Miembros miembros={data.miembros} crearMiembro={crearMiembro} borrarMiembro={borrarMiembro} />}
      {tab==='sesiones' && <Sesiones sesiones={data.sesiones} crearSesion={crearSesion} borrarSesion={borrarSesion} />}
      {tab==='reportes' && <Reportes data={data} />}
      {tab==='ajustes' && <Ajustes />}

      <footer className="footer" style={{marginTop:24}}>
        <div>Funciona 100% offline. Puedes instalarla desde tu navegador (Añadir a pantalla de inicio).</div>
        <div>Hecho con React + Vite PWA.</div>
      </footer>
    </div>
  )
}

function Miembros({miembros, crearMiembro, borrarMiembro}){
  const [nombre, setNombre] = useState('')
  const [codigo, setCodigo] = useState('')
  const [rol, setRol] = useState('')

  return (
    <section className="app">
      <div className="card">
        <strong>Nuevo miembro</strong>
        <div className="row" style={{marginTop:8}}>
          <input placeholder="Nombre" value={nombre} onChange={e=>setNombre(e.target.value)} />
          <input placeholder="Código (opcional)" value={codigo} onChange={e=>setCodigo(e.target.value)} />
          <input placeholder="Rol (opcional)" value={rol} onChange={e=>setRol(e.target.value)} />
          <button className="primary" onClick={()=>{
            if(!nombre.trim()) return
            crearMiembro({nombre: nombre.trim(), codigo: codigo.trim(), rol: rol.trim()})
            setNombre(''); setCodigo(''); setRol('')
          }}>Agregar</button>
        </div>
      </div>

      <div className="card">
        <strong>Lista de miembros</strong>
        <table className="table" style={{marginTop:8}}>
          <thead><tr><th>Nombre</th><th>Código/Rol</th><th></th></tr></thead>
          <tbody>
            {miembros.map(m => (
              <tr key={m.id}>
                <td>{m.nombre}</td>
                <td className="tag">{m.codigo || m.rol || '—'}</td>
                <td><button onClick={()=>borrarMiembro(m.id)} className="ghost">🗑️</button></td>
              </tr>
            ))}
            {miembros.length===0 && <tr><td colSpan="3" className="tag">Aún no hay miembros.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function Sesiones({sesiones, crearSesion, borrarSesion}){
  const [fechaISO, setFechaISO] = useState(()=> new Date().toISOString().slice(0,16)) // local datetime
  const [tema, setTema] = useState('Reunión de semillero')

  return (
    <section className="app">
      <div className="card">
        <strong>Nueva sesión</strong>
        <div className="row" style={{marginTop:8, alignItems:'center'}}>
          <input type="datetime-local" value={fechaISO} onChange={e=>setFechaISO(e.target.value)} />
          <input placeholder="Tema" value={tema} onChange={e=>setTema(e.target.value)} />
          <button className="primary" onClick={()=>{
            if(!tema.trim()) return
            crearSesion({fechaISO, tema: tema.trim()})
          }}>Crear</button>
        </div>
      </div>

      <div className="card">
        <strong>Sesiones</strong>
        <table className="table" style={{marginTop:8}}>
          <thead><tr><th>Fecha</th><th>Tema</th><th></th></tr></thead>
          <tbody>
            {sesiones.map(s => (
              <tr key={s.id}>
                <td>{new Date(s.fechaISO).toLocaleString()}</td>
                <td>{s.tema}</td>
                <td><button onClick={()=>borrarSesion(s.id)} className="ghost">🗑️</button></td>
              </tr>
            ))}
            {sesiones.length===0 && <tr><td colSpan="3" className="tag">Aún no hay sesiones.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function Reportes({data}){
  const filas = []
  for(const sesion of data.sesiones){
    const map = data.asistencias[sesion.id] || {}
    const presentes = Object.values(map).filter(r=>r.presente).length
    filas.push({
      fecha: new Date(sesion.fechaISO).toLocaleString(),
      tema: sesion.tema,
      total: data.miembros.length,
      presentes,
      ausentes: Math.max(0, data.miembros.length - presentes)
    })
  }
  return (
    <section className="app">
      <div className="card">
        <strong>Resumen por sesión</strong>
        <table className="table" style={{marginTop:8}}>
          <thead><tr><th>Fecha</th><th>Tema</th><th>Total</th><th>Presentes</th><th>Ausentes</th></tr></thead>
          <tbody>
            {filas.map((f,i)=> (
              <tr key={i}>
                <td>{f.fecha}</td>
                <td>{f.tema}</td>
                <td>{f.total}</td>
                <td>{f.presentes}</td>
                <td>{f.ausentes}</td>
              </tr>
            ))}
            {filas.length===0 && <tr><td colSpan="5" className="tag">No hay datos todavía.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="card">
        <strong>Consejo</strong>
        <p className="tag">Si quieres sincronizar entre dispositivos, puedes exportar el backup y compartirlo por WhatsApp/Drive, o conectar esto a una base de datos (por ejemplo, Supabase) más adelante.</p>
      </div>
    </section>
  )
}

function Ajustes(){
  return (
    <section className="app">
      <div className="card">
        <strong>Instalación en iOS y Android</strong>
        <ul>
          <li>En Android (Chrome/Edge): menú ⋮ &rarr; <em>Añadir a pantalla de inicio</em>.</li>
          <li>En iOS (Safari): botón <em>Compartir</em> &rarr; <em>Añadir a pantalla de inicio</em>.</li>
        </ul>
        <p className="tag">Esto crea un acceso directo que se abre en modo pantalla completa (standalone), como una app nativa, sin pasar por Play Store ni App Store.</p>
      </div>
      <div className="card">
        <strong>Privacidad</strong>
        <p className="tag">Los datos se guardan solo en tu dispositivo (LocalStorage). Puedes borrar los datos limpiando el caché del navegador.</p>
      </div>
      <div className="card">
        <strong>Acerca de</strong>
        <p className="tag">Versión 0.0.1 · Construida para pruebas del semillero.</p>
      </div>
    </section>
  )
}

function labelTab(k){
  return {
    tomar: 'Tomar asistencia',
    miembros: 'Miembros',
    sesiones: 'Sesiones',
    reportes: 'Reportes',
    ajustes: 'Ajustes'
  }[k] || k
}

function csv(v){
  const s = (v ?? '').toString()
  if(/[",\n]/.test(s)) return '"' + s.replaceAll('"','""') + '"'
  return s
}

export default App
