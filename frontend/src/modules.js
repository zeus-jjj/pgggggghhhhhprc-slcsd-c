import io from 'socket.io-client'


export const getAuthCookie = () => {
    // TODO: Исправить токен (убрать)
    const token = localStorage.getItem('hash');
    // const token = 'rot_ebal'

    return {
        headers: {"Authorization": token}
    }
}

// TODO: Исправить токен (убрать)
export const create_socket = (namespace='/') => io('https://telegram.pokerhub.pro/api'+namespace, {
    query: {'Authorization': localStorage.getItem('hash')}
})
// export const create_socket = (namespace='/') => io('https://telegram.pokerhub.pro/api'+namespace, {
//     query: {'Authorization': 'rot_ebal'}
// })


export function isAuth(User, route) {
    return (!User.resultCode && Object.keys(User).length !== 0) && (route.roles.includes(0) || route.roles.includes(User.role_id))
}

export function formHandle(setState, {target: {value, type, name, files, checked}}) {

    let setType = value

    if (type === 'file') {
        setType = files
    } else if (type === 'checkbox') {
        setType = checked
    }
    setState(state => {
        return {
            ...state,
            [name]: setType
        }
    })
}

export const notifyMe = (data) => {

    new Notification(data.title, {
        tag: 'ache-mail',
        body: data.description,
        icon: data.icon
    })
}

export const getTime = (date) => {
    const month = (date.getMonth().toString().length === 1 ? '0' : '') + date.getMonth()
    const day = (date.getDate().toString().length === 1 ? '0' : '') + date.getDate()
    const hour = (date.getHours().toString().length === 1 ? '0' : '') + date.getHours()
    const minute = (date.getMinutes().toString().length === 1 ? '0' : '') + date.getMinutes()
    return `${date.getFullYear()}-${month}-${day}T${hour}:${minute}`
}