// app.js (Usar 'type="text/babel"' en el HTML para transpilar)

// ====================================================================================
// 1. CONFIGURACIÓN E INTERFACES (Adaptado a JS/Babel)
// ====================================================================================

const { useState, useEffect, useCallback, useMemo } = React;
// Iconos de lucide-react (asumimos que están disponibles globalmente o se cargan)
// En un entorno de CDN simple, estos iconos no estarán disponibles directamente.
// Los reemplazamos por el componente "Icon" simulado o los omitimos.
// NOTA: Para este entorno, los iconos de `lucide-react` NO se cargarán.
// Se recomienda usar un CDN de iconos más simple o iconos Unicode.
// Reemplazo temporal de iconos con props de texto o emojis.
const Icon = ({ name, className, children }) => {
  const map = {
    Clock: '⏰', Calendar: '📅', CheckSquare: '✅', ListTodo: '📝', Plus: '➕',
    Trash2: '🗑️', Edit: '✏️', Save: '💾', X: '❌', Loader2: '🔄'
  };
  return <span className={className} style={{ fontSize: '1.25rem' }}>{map[name] || children}</span>;
};

// ===================
// Tipos de Datos (Simulados)
// ===================
// Estos son solo objetos de JS, los tipos TS se han eliminado.
// Horario
// id_usuario: string; // Clave primaria
// dia: string;
// hora: string;
// materia: string;
// salon: string;
// profesor: string;
//
// Tarea
// id: number; // Clave primaria
// titulo: string;
// descripcion: string;
// fecha: string;
// prioridad: 1 | 2 | 3; // 1: Baja, 2: Media, 3: Alta
// completada: boolean;
// ===================

const PrioridadMap = { 1: 'Baja', 2: 'Media', 3: 'Alta' };
const diasOpciones = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

// Define las constantes de Supabase
const supabaseUrl = 'https://bogoihunfanuoakwxfmb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvZ29paHVuZmFudW9ha3d4Zm1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NTUwMzUsImV4cCI6MjA3NjAzMTAzNX0.sq1GtN_bkXwONunT-_uF9kD7q6MuYjKWKkTLpcoigZM';

// Inicialización del cliente Supabase (Asumiendo que window.supabase está disponible)
let supabaseClient = null;
if (window.supabase && window.supabase.createClient) {
    supabaseClient = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
}

// ====================================================================================
// 2. FUNCIONES CRUD DEL CLIENTE SUPABASE
// ====================================================================================

/** Funciones CRUD para Horarios (PK: id_usuario) */
const getHorarios = async (client) => {
    if (!client) return [];
    const { data, error } = await client
        .from('horarios')
        .select('*')
        .order('dia', { ascending: true })
        .order('hora', { ascending: true });
    if (error) {
        console.error('Error al obtener horarios:', error);
        return [];
    }
    // Convertir id_usuario a String para consistencia con la interfaz original
    return data.map(h => ({ ...h, id_usuario: String(h.id_usuario) }));
};

const createHorario = async (client, newHorario) => {
    // Usamos Date.now() como un id simple en este entorno simulado
    const id_usuario = crypto.randomUUID ? crypto.randomUUID() : `temp-${Date.now()}`;
    const horarioWithId = { ...newHorario, id_usuario };

    const { error } = await client
        .from('horarios')
        .insert([horarioWithId]);
    if (error) {
        console.error('Error al crear horario:', error);
        throw new Error('No se pudo crear el horario.');
    }
};

const updateHorario = async (client, id_usuario, updates) => {
    const { error } = await client
        .from('horarios')
        .update(updates)
        .eq('id_usuario', id_usuario);
    if (error) {
        console.error('Error al actualizar horario:', error);
        throw new Error('No se pudo actualizar el horario.');
    }
};

const deleteHorario = async (client, id_usuario) => {
    const { error } = await client
        .from('horarios')
        .delete()
        .eq('id_usuario', id_usuario);
    if (error) {
        console.error('Error al eliminar horario:', error);
        throw new Error('No se pudo eliminar el horario.');
    }
};

/** Funciones CRUD para Tareas (PK: id) */
const getTareas = async (client) => {
    if (!client) return [];
    const { data, error } = await client
        .from('tareas')
        .select('*')
        .order('completada', { ascending: true })
        .order('fecha', { ascending: true })
        .order('prioridad', { ascending: false });
    if (error) {
        console.error('Error al obtener tareas:', error);
        return [];
    }
    return data;
};

const createTarea = async (client, newTarea) => {
    const { error } = await client
        .from('tareas')
        .insert([{ ...newTarea, completada: false }]);
    if (error) {
        console.error('Error al crear tarea:', error);
        throw new Error('No se pudo crear la tarea.');
    }
};

const updateTarea = async (client, id, updates) => {
    const { error } = await client
        .from('tareas')
        .update(updates)
        .eq('id', id);
    if (error) {
        console.error('Error al actualizar tarea:', error);
        throw new Error('No se pudo actualizar la tarea.');
    }
};

// No hay función deleteTarea en el código original, se asume que no se necesita para el CRUD básico.

// ====================================================================================
// 3. COMPONENTES REUTILIZABLES
// ====================================================================================

const Header = ({ currentPage, setPage }) => (
    <header className="bg-white shadow-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <h1 className="text-3xl font-extrabold text-indigo-600 tracking-tight">
                Planificador Académico
            </h1>
            <nav className="flex space-x-4">
                <button
                    onClick={() => setPage('horarios')}
                    className={`flex items-center px-4 py-2 rounded-full text-sm font-medium transition duration-150 ${
                        currentPage === 'horarios'
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'
                    }`}
                >
                    <Icon name="Clock" className="w-5 h-5 mr-2" />
                    Horarios
                </button>
                <button
                    onClick={() => setPage('tareas')}
                    className={`flex items-center px-4 py-2 rounded-full text-sm font-medium transition duration-150 ${
                        currentPage === 'tareas'
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'
                    }`}
                >
                    <Icon name="ListTodo" className="w-5 h-5 mr-2" />
                    Tareas
                </button>
            </nav>
        </div>
    </header>
);

const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-48">
        <Icon name="Loader2" className="w-8 h-8 animate-spin text-indigo-500" />
        <span className="ml-3 text-lg text-gray-600">Cargando datos...</span>
    </div>
);

const MessageBlock = ({ message, type }) => {
    const baseClasses = "p-4 rounded-lg flex items-center shadow-md";
    const typeClasses = {
        success: "bg-green-100 text-green-700 border border-green-300",
        error: "bg-red-100 text-red-700 border border-red-300",
        info: "bg-blue-100 text-blue-700 border border-blue-300",
    };
    return (
        <div className={`${baseClasses} ${typeClasses[type]} mt-4`}>
            {message}
        </div>
    );
};


// ====================================================================================
// 4. GESTIÓN DE HORARIOS (HorarioManager)
// ====================================================================================

const HorarioManager = ({ supabaseClient }) => {
    const [horarios, setHorarios] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingHorarioId, setEditingHorarioId] = useState(null);
    const [formData, setFormData] = useState({ dia: '', hora: '', materia: '', salon: '', profesor: '' });
    const [message, setMessage] = useState(null);

    const fetchHorarios = useCallback(async () => {
        if (!supabaseClient) return;
        setLoading(true);
        const data = await getHorarios(supabaseClient);
        setHorarios(data);
        setLoading(false);
    }, [supabaseClient]);

    useEffect(() => {
        if (supabaseClient) {
            fetchHorarios();
        }
    }, [fetchHorarios, supabaseClient]);

    const handleEdit = (horario) => {
        setEditingHorarioId(horario.id_usuario);
        setFormData({ dia: horario.dia, hora: horario.hora, materia: horario.materia, salon: horario.salon, profesor: horario.profesor });
        setMessage(null);
    };

    const handleNew = () => {
        setEditingHorarioId('new');
        setFormData({ dia: 'Lunes', hora: '08:00', materia: '', salon: '', profesor: '' });
        setMessage(null);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!supabaseClient) { setMessage({ text: 'El cliente de Supabase aún no está listo.', type: 'error' }); return; }
        if (!formData.dia || !formData.hora || !formData.materia) {
            setMessage({ text: 'Día, Hora y Materia son obligatorios.', type: 'error' });
            return;
        }

        try {
            if (editingHorarioId === 'new') {
                await createHorario(supabaseClient, formData);
                setMessage({ text: 'Horario creado exitosamente.', type: 'success' });
            } else if (editingHorarioId) {
                await updateHorario(supabaseClient, editingHorarioId, formData);
                setMessage({ text: 'Horario actualizado exitosamente.', type: 'success' });
            }
            setEditingHorarioId(null);
            await fetchHorarios();
        } catch (err) {
            setMessage({ text: (err.message || 'Error desconocido.'), type: 'error' });
        }
    };

    const handleDelete = async (id_usuario) => {
        if (!supabaseClient) { setMessage({ text: 'El cliente de Supabase aún no está listo.', type: 'error' }); return; }
        try {
            await deleteHorario(supabaseClient, id_usuario);
            setMessage({ text: 'Horario eliminado exitosamente.', type: 'success' });
            await fetchHorarios();
        } catch (err) {
            setMessage({ text: (err.message || 'Error desconocido.'), type: 'error' });
        }
    };

    const sortedHorarios = useMemo(() => {
        const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
        return [...horarios].sort((a, b) => {
            const diaA = dias.indexOf(a.dia);
            const diaB = dias.indexOf(b.dia);
            if (diaA !== diaB) return diaA - diaB;
            return a.hora.localeCompare(b.hora);
        });
    }, [horarios]);

    if (!supabaseClient) return <MessageBlock message="Error: El cliente de Supabase no se pudo inicializar." type="error" />;
    if (loading) return <LoadingSpinner />;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h2 className="text-4xl font-extrabold text-gray-800 mb-6">Gestión de Horarios</h2>
            <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
                <button
                    onClick={handleNew}
                    className="flex items-center bg-indigo-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition duration-200 shadow-md"
                >
                    <Icon name="Plus" className="w-5 h-5 mr-2" />
                    Añadir Nuevo Horario
                </button>
            </div>

            {message && <MessageBlock message={message.text} type={message.type} />}

            {(editingHorarioId === 'new' || editingHorarioId !== null && editingHorarioId !== 'new') && (
                <form onSubmit={handleSave} className="bg-white p-6 rounded-xl shadow-xl mb-8 border border-indigo-200">
                    <h3 className="text-2xl font-bold mb-4 text-indigo-700">
                        {editingHorarioId === 'new' ? 'Nuevo Horario' : 'Editar Horario'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Día</label>
                            <select
                                name="dia"
                                value={formData.dia}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                            >
                                {diasOpciones.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Hora</label>
                            <input
                                type="time"
                                name="hora"
                                value={formData.hora}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Materia</label>
                            <input
                                type="text"
                                name="materia"
                                value={formData.materia}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Salón</label>
                            <input
                                type="text"
                                name="salon"
                                value={formData.salon}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Profesor</label>
                            <input
                                type="text"
                                name="profesor"
                                value={formData.profesor}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                            />
                        </div>
                    </div>
                    <div className="mt-6 flex space-x-3">
                        <button
                            type="submit"
                            className="flex items-center bg-green-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-green-700 transition duration-200 shadow-md"
                        >
                            <Icon name="Save" className="w-5 h-5 mr-2" />
                            Guardar
                        </button>
                        <button
                            type="button"
                            onClick={() => setEditingHorarioId(null)}
                            className="flex items-center bg-gray-400 text-white px-5 py-2 rounded-lg font-semibold hover:bg-gray-500 transition duration-200"
                        >
                            <Icon name="X" className="w-5 h-5 mr-2" />
                            Cancelar
                        </button>
                    </div>
                </form>
            )}

            {sortedHorarios.length === 0 && !loading && (
                <MessageBlock message="No hay horarios registrados. ¡Añade el primero!" type="info" />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedHorarios.map(horario => (
                    <div
                        key={horario.id_usuario}
                        className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-indigo-500 hover:shadow-xl transition duration-200"
                    >
                        <div className="flex justify-between items-start">
                            <h4 className="text-xl font-bold text-gray-800 mb-1">{horario.materia}</h4>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => handleEdit(horario)}
                                    className="p-2 rounded-full text-indigo-600 hover:bg-indigo-100 transition duration-150"
                                    title="Editar"
                                >
                                    <Icon name="Edit" className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => handleDelete(horario.id_usuario)}
                                    className="p-2 rounded-full text-red-600 hover:bg-red-100 transition duration-150"
                                    title="Eliminar"
                                >
                                    <Icon name="Trash2" className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-3 font-medium">{horario.profesor}</p>
                        <div className="space-y-1 text-sm">
                            <p className="flex items-center text-gray-700"><Icon name="Calendar" className="w-4 h-4 mr-2 text-indigo-500" /> <strong>Día:</strong> {horario.dia}</p>
                            <p className="flex items-center text-gray-700"><Icon name="Clock" className="w-4 h-4 mr-2 text-indigo-500" /> <strong>Hora:</strong> {horario.hora}</p>
                            <p className="flex items-center text-gray-700">
                                <span className="inline-block w-4 h-4 mr-2 text-indigo-500">🏢</span>
                                <strong>Salón:</strong> {horario.salon || 'N/A'}
                            </p>
                        </div>
                        <p className="mt-4 text-xs text-gray-400 truncate" title={`ID Usuario: ${horario.id_usuario}`}>
                            ID: {horario.id_usuario}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};


// ====================================================================================
// 5. GESTIÓN DE TAREAS (TareaManager y TareaForm)
// ====================================================================================

const TareaForm = ({ initialData, onSave, onCancel, isEditing }) => {
    const [formData, setFormData] = useState(() => ({
        titulo: initialData?.titulo || '',
        descripcion: initialData?.descripcion || '',
        fecha: initialData?.fecha || new Date().toISOString().split('T')[0],
        prioridad: initialData?.prioridad || 2,
    }));
    const [message, setMessage] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'prioridad' ? parseInt(value) : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.titulo || !formData.fecha) {
            setMessage({ text: 'Título y Fecha son obligatorios.', type: 'error' });
            return;
        }
        try {
            await onSave(formData);
            setMessage(null); // Limpiar mensaje de error al guardar con éxito
        } catch (err) {
            setMessage({ text: (err.message || 'Error desconocido al guardar.'), type: 'error' });
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-xl mb-8 border border-green-200">
            <h3 className="text-2xl font-bold mb-4 text-green-700">
                {isEditing ? 'Editar Tarea' : 'Nueva Tarea'}
            </h3>
            {message && <MessageBlock message={message.text} type="error" />}
            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700">Título</label>
                        <input
                            type="text"
                            name="titulo"
                            value={formData.titulo}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
                        />
                    </div>
                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700">Fecha Límite</label>
                        <input
                            type="date"
                            name="fecha"
                            value={formData.fecha}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
                        />
                    </div>
                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700">Prioridad</label>
                        <select
                            name="prioridad"
                            value={formData.prioridad}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
                        >
                            <option value={3}>3 - Alta</option>
                            <option value={2}>2 - Media</option>
                            <option value={1}>1 - Baja</option>
                        </select>
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Descripción</label>
                        <textarea
                            name="descripcion"
                            value={formData.descripcion}
                            onChange={handleChange}
                            rows={3}
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
                        />
                    </div>
                </div>
                <div className="mt-6 flex space-x-3">
                    <button
                        type="submit"
                        className="flex items-center bg-green-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-green-700 transition duration-200 shadow-md"
                    >
                        <Icon name="Save" className="w-5 h-5 mr-2" />
                        Guardar Tarea
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex items-center bg-gray-400 text-white px-5 py-2 rounded-lg font-semibold hover:bg-gray-500 transition duration-200"
                    >
                        <Icon name="X" className="w-5 h-5 mr-2" />
                        Cancelar
                    </button>
                </div>
            </form>
        </div>
    );
};


const TareaManager = ({ supabaseClient }) => {
    const [tareas, setTareas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingTarea, setEditingTarea] = useState(null);
    const [showNewForm, setShowNewForm] = useState(false);
    const [message, setMessage] = useState(null);

    const fetchTareas = useCallback(async () => {
        if (!supabaseClient) return;
        setLoading(true);
        const data = await getTareas(supabaseClient);
        setTareas(data);
        setLoading(false);
    }, [supabaseClient]);

    useEffect(() => {
        if (supabaseClient) {
            fetchTareas();
        }
    }, [fetchTareas, supabaseClient]);

    const handleCreate = async (newTareaData) => {
        if (!supabaseClient) { setMessage({ text: 'El cliente de Supabase aún no está listo.', type: 'error' }); return; }
        await createTarea(supabaseClient, newTareaData);
        setMessage({ text: 'Tarea creada exitosamente.', type: 'success' });
        setShowNewForm(false);
        await fetchTareas();
    };

    const handleUpdate = async (updatedData) => {
        if (!supabaseClient) { setMessage({ text: 'El cliente de Supabase aún no está listo.', type: 'error' }); return; }
        if (!editingTarea) return;

        const updates = {
            titulo: updatedData.titulo,
            descripcion: updatedData.descripcion,
            fecha: updatedData.fecha,
            prioridad: updatedData.prioridad,
        };
        await updateTarea(supabaseClient, editingTarea.id, updates);
        setMessage({ text: 'Tarea actualizada exitosamente.', type: 'success' });
        setEditingTarea(null);
        await fetchTareas();
    };

    const handleToggleComplete = async (tarea) => {
        if (!supabaseClient) { setMessage({ text: 'El cliente de Supabase aún no está listo.', type: 'error' }); return; }
        try {
            const updates = { completada: !tarea.completada };
            await updateTarea(supabaseClient, tarea.id, updates);
            setMessage({ text: `Tarea marcada como ${updates.completada ? 'completada' : 'pendiente'}.`, type: 'success' });
            await fetchTareas();
        } catch (err) {
            setMessage({ text: (err.message || 'Error al actualizar estado.'), type: 'error' });
        }
    };

    const getPrioridadClasses = (prioridad, completada) => {
        if (completada) return 'bg-gray-200 text-gray-700';
        switch (prioridad) {
            case 3: return 'bg-red-500 text-white';
            case 2: return 'bg-yellow-500 text-gray-800';
            case 1: return 'bg-green-500 text-white';
            default: return 'bg-gray-200 text-gray-700';
        }
    };

    const getPrioridadText = (prioridad) => {
        switch (prioridad) {
            case 3: return 'Alta';
            case 2: return 'Media';
            case 1: return 'Baja';
            default: return 'N/A';
        }
    };

    if (!supabaseClient) return <MessageBlock message="Error: El cliente de Supabase no se pudo inicializar." type="error" />;
    if (loading) return <LoadingSpinner />;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h2 className="text-4xl font-extrabold text-gray-800 mb-6">Gestión de Tareas</h2>
            <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
                <button
                    onClick={() => { setShowNewForm(true); setEditingTarea(null); setMessage(null); }}
                    className="flex items-center bg-green-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-green-700 transition duration-200 shadow-md"
                >
                    <Icon name="Plus" className="w-5 h-5 mr-2" />
                    Añadir Nueva Tarea
                </button>
            </div>

            {message && <MessageBlock message={message.text} type={message.type} />}

            {(showNewForm || editingTarea) && (
                <TareaForm
                    initialData={editingTarea}
                    onSave={editingTarea ? handleUpdate : handleCreate}
                    onCancel={() => { setShowNewForm(false); setEditingTarea(null); }}
                    isEditing={!!editingTarea}
                />
            )}

            {tareas.length === 0 && !loading && (
                <MessageBlock message="No hay tareas pendientes. ¡Excelente trabajo!" type="info" />
            )}

            <div className="space-y-4">
                {tareas.map((tarea, index) => (
                    <div
                        key={tarea.id || index}
                        className={`flex items-center bg-white p-5 rounded-xl shadow-md border-l-4 transition duration-200 ${
                            tarea.completada ? 'border-gray-400 opacity-60' : 'border-green-500 hover:shadow-lg'
                        }`}
                    >
                        <button
                            onClick={() => handleToggleComplete(tarea)}
                            className={`p-2 rounded-full mr-4 transition duration-150 ${
                                tarea.completada
                                    ? 'bg-green-500 text-white hover:bg-green-600'
                                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                            }`}
                            title={tarea.completada ? 'Marcar como Pendiente' : 'Marcar como Completada'}
                        >
                            <Icon name="CheckSquare" className="w-6 h-6" />
                        </button>

                        <div className="flex-1 min-w-0">
                            <h4 className={`text-lg font-semibold ${tarea.completada ?
                                'line-through text-gray-500' : 'text-gray-800'}`}>
                                {tarea.titulo}
                            </h4>
                            <p className="text-sm text-gray-600 truncate">{tarea.descripcion}</p>
                            <p className="text-xs text-gray-400 mt-1">ID: {tarea.id}</p>
                        </div>

                        <div className="flex flex-col items-end space-y-1 ml-4">
                            <span
                                className={`text-xs font-bold px-3 py-1 rounded-full ${getPrioridadClasses(tarea.prioridad, tarea.completada)}`}
                            >
                                {getPrioridadText(tarea.prioridad)}
                            </span>
                            <p className="flex items-center text-sm text-gray-600">
                                <Icon name="Calendar" className="w-4 h-4 mr-1" />
                                {tarea.fecha}
                            </p>
                        </div>

                        <button
                            onClick={() => { setEditingTarea(tarea); setShowNewForm(false); setMessage(null); }}
                            className="ml-4 p-2 rounded-full text-blue-600 hover:bg-blue-100 transition duration-150"
                            title="Editar Tarea"
                            disabled={tarea.completada}
                        >
                            <Icon name="Edit" className="w-5 h-5" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};


// ====================================================================================
// 6. COMPONENTE PRINCIPAL (App)
// ====================================================================================

const App = () => {
    const [currentPage, setCurrentPage] = useState('horarios');
    // Usamos el cliente inicializado globalmente o nulo
    const client = supabaseClient; 

    // Se asume que client ya está listo o se muestra el error dentro de los managers
    // Se elimina el estado de isClientLoading y el useEffect para simplificar la carga con CDN.

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <Header currentPage={currentPage} setPage={setCurrentPage} />
            <main className="pb-10">
                {!client ? (
                    <MessageBlock message="Error de Configuración: El cliente de Supabase no se inicializó. Revisa los CDN y la clave." type="error" />
                ) : currentPage === 'horarios' ? (
                    <HorarioManager supabaseClient={client} />
                ) : (
                    <TareaManager supabaseClient={client} />
                )}
            </main>
        </div>
    );
}

// Hacer el componente App global para que el script de montaje en el HTML pueda acceder a él
window.App = App;