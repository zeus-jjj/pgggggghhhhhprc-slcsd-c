import React from 'react';
import {NavLink} from "react-router-dom";
import {apiUrl} from "../../config";

const User = ({user}) => {
    return (
        <NavLink to={'/profile/'+user.id} className="d-flex text-muted pt-3 text-decoration-none" id={user.id} style={{cursor: 'pointer'}}>

            <img
                src={user.photo_code?.startsWith('http') ? user.photo_code : apiUrl + '/static/img/avatars/' + user.photo_code}
                width="64" height="64" alt={'avatar'} className="m-1"
                style={{borderRadius: '50%', objectFit: 'cover'}}/>
            <div className="pb-3 mb-0 small lh-sm border-bottom w-100 my-auto ms-2">
                <div className={'d-flex justify-content-between'}>
                    <div className="d-flex flex-column">
                        <strong className="text-gray-dark h6">@{user.username}</strong>
                        <span className="d-block">{user.first_name} {user.last_name} ({user.role})</span>
                        <span className="d-block">Направление: {user.direction ?? "Нет"}</span>
                        <span className="d-block">ID: {user.id}</span>
                    </div>

                </div>
            </div>
        </NavLink>
    )
}

export default User;