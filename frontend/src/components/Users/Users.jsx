import React, {useState, useEffect} from "react";
import axios from "axios";
import {apiUrl} from "../../config";
import {getAuthCookie} from "../../modules";
import User from "./User";
import Filters from "./Filters"

const Users = () => {
    const [roles, setRoles] = useState([])
    const [directions, setDirections] = useState([])
    const [users, setUsers] = useState([])
    const getFilter = JSON.parse(localStorage.getItem('users_filters'))

    const [filter, setFilter] = useState(getFilter || {
        name: '',
        roles: [],
        directions: []
    })

    if (!getFilter) {
        localStorage.setItem('users_filters', JSON.stringify(filter))
    }

    useEffect(() => {
        axios.get(apiUrl + '/config/roles', getAuthCookie())
            .then(resp => setRoles(resp.data))

        axios.get(apiUrl+'/config/directions', getAuthCookie())
            .then(resp => setDirections(resp.data))

    }, [])

    useEffect(() => {
        console.log(filter)
        localStorage.setItem('users_filters', JSON.stringify(filter))

        axios.get(apiUrl + '/config/users?filter='+JSON.stringify(filter), getAuthCookie())
            .then(resp => setUsers(resp.data))
    }, [filter])

    return (
        <div className="justify-content-between flex-wrap flex-md-nowrap pt-3 pb-2 mb-3 border-bottom container">
            <h1 className="h2">Список пользователей:</h1>
            <button className="btn btn-outline-light my-3 px-5" type="button" data-bs-toggle="offcanvas"
                    data-bs-target="#usersFilters" aria-controls="usersFilters">Фильтры
            </button>
            <Filters filter={filter} setFilter={setFilter} directions={directions} roles={roles}/>
            {users.map((user) => <User key={user.id} user={user} />)}

        </div>
    )
}
export default Users;