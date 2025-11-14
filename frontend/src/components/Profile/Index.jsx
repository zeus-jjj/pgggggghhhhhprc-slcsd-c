import React, {useState, useEffect} from 'react';
import {useParams} from "react-router-dom";
import axios from "axios";
import {apiUrl, profile_cards} from "../../config";
import {getAuthCookie} from "../../modules";
import Card from "./Card";
import AlertForm from "./AlertForm";
import Form from "./Form";
import History from "./History";

const Profile = () => {
    const user_id = useParams().id
    const [user, setUser] = useState({});
    const [notification, setNotification] = useState({visible: false, text: '', success: true});

    useEffect(() => {
        axios.get(apiUrl + '/config/profile/' + user_id, getAuthCookie())
            .then(resp => setUser(resp.data))
    }, [user_id]);

    if (Object.keys(user).length === 0 || user.roles.length === 0) {
        return <></>
    }

    return (
        <div className={'container-fluid'}>
            <div className="d-flex text-body-secondary pt-3">
                <img
                    src={user.photo_code?.startsWith('http')
                        ? user.photo_code :
                        apiUrl + '/static/img/avatars/' + user.photo_code}
                    width="128" height="128" alt={'avatar'} className="m-1"
                    style={{borderRadius: '50%', objectFit: 'cover'}}/>

                <div className="pb-3 mb-0 small lh-sm border-bottom w-100 my-auto ms-2">
                    <div className={'d-flex justify-content-between'}>
                        <div className="d-flex flex-column">
                            <h1 className="text-gray-dark">{user.first_name} {user.last_name}</h1>
                            <a href={'https://t.me/'+(user.username ?? 'pokerhub_robot')} className="d-block h2 text-decoration-none">@{user.username}</a>
                        </div>
                        <div className={'d-grid gap-2 d-md-flex justify-content-md-end'}>
                            <button className={'btn btn-success'} data-bs-toggle="modal" data-bs-target="#AlertModal">
                                Уведомление
                            </button>
                            <button className={'btn btn-warning'} data-bs-toggle="modal" data-bs-target="#staticBackdrop">
                                Редактировать
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div className={''}>
                <div className={'my-4 card-group'}>
                    <Card title={'Роль'} value={user.roles.filter(({id}) => id === user.role_id)[0].name}/>
                    <Card title={'Направление'} value={user.directions.filter(({id}) => id === user.direction_id)[0].title}/>
                    {profile_cards.map(({name, key}) => <Card key={key} title={name} value={user[key] || 'Нет'}/>)}
                    <Card title={'UTM INFO'} values={[`Campaign: ${user.campaign}`,`Source: ${user.source}`,`Medium: ${user.medium}`,`Term: ${user.term}`,`Content: ${user.content}`,]}/>
                </div>
                <a data-bs-toggle="collapse" href="#biography" role="button" aria-expanded="true" aria-controls="10"
                   className="text-decoration-none text-white border-bottom"><h3>Биография</h3></a>
                <hr/>
                <div className={'mb-3 multi-collapse collapse'} id={'biography'}>
                    <h4>{user.biography}</h4>
                </div>
                <History history={user.history}/>
                <AlertForm target={user}/>
                <Form target={user} setTarget={setUser}/>
            </div>
            {notification.visible && (
                <div className={`alert ${notification.success ? 'alert-success' : 'alert-danger'}`} role="alert" style={{position: 'fixed', bottom: '20px', right: '20px'}}>
                    {notification.text}
                </div>
            )}
        </div>
    )
}

export default Profile;
