import React from "react";
import axios from "axios";
import {apiUrl} from "../../config";
import {getAuthCookie} from "../../modules";

const Form = ({target, setTarget}) => {

    function FormHandle({target: {name, value}}) {
        setTarget(t => {
            return {
                ...t,
                [name]: ['role_id', 'direction_id'].includes(name) ? parseInt(value) : value
            }

        })
    }

    function sendForm() {
        axios.put(apiUrl + '/config/users', target, getAuthCookie())
            .then(resp => {console.log('Change to: ', resp.data)})

    }

    return (

        <div className="modal fade" id="staticBackdrop"
             tabIndex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
            <div className="modal-dialog">
                <div>
                    <div className="modal-content">
                        <div className="modal-header">
                            <h1 className="modal-title fs-5" id="labelForm">Изменение пользователя</h1>
                            <button type="button" className="btn-close" data-bs-dismiss="modal"
                                    aria-label="Close"></button>
                        </div>
                        <div className="modal-body">
                            <input type="text" name="id" hidden id="id"/>
                            <div className="mb-3">
                                <label htmlFor="first_name" className="form-label">Имя</label>
                                <input onBlur={FormHandle} defaultValue={target.first_name} className="form-control"
                                       name="first_name" type="text"/>
                            </div>
                            <div className="mb-3">
                                <label htmlFor="last_name" className="form-label">Фамилия</label>
                                <input onBlur={FormHandle} defaultValue={target.last_name} className="form-control"
                                       name="last_name" type="text"/>
                            </div>
                            <div className="mb-3">
                                <label htmlFor="role" className="form-label">Роль</label>
                                <select onChange={FormHandle} value={target.role_id} className="form-select form-select-lg mb-3" name="role_id">
                                    {target.roles.map(role =>
                                        <option key={role.id} value={role.id}>
                                            {role.name}
                                        </option>
                                    )}
                                </select>
                            </div>
                            <div className="mb-3">
                                <label htmlFor="role" className="form-label">Направление</label>
                                <select onChange={FormHandle} value={target.direction_id} className="form-select form-select-lg mb-3" name="direction_id">
                                    {target.directions.map(direction =>
                                        <option key={direction.id} value={direction.id}>
                                            {direction.title}
                                        </option>
                                    )}
                                </select>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="submit" className="btn btn-primary" data-bs-dismiss="modal"
                                    onClick={sendForm}>Сохранить
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    )
}
export default Form