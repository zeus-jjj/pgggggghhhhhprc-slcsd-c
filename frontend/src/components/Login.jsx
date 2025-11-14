import React, {useContext} from "react";
import axios from "axios";
import logo from "../static/logo.svg";
import TelegramLoginButton from 'react-telegram-login';
import {apiUrl} from "../config";
import {authContext} from './Context'

const Login = () => {
    const {setUser} = useContext(authContext);
    const handleTelegramResponse = response => {
        console.log(response)
        axios.post(apiUrl+'/auth/login', response).then(resp => {
            if (resp.data.resultCode === 2) {
                alert(resp.data.message)
                return
            }
            setUser(resp.data)
            window.localStorage.setItem('hash',response.hash)
        })
    }

    return (
        <div style={ {display: 'table',width: '100%', minHeight:'100vh' }}>
            <div style={{display: 'table-cell', textAlign: 'center', verticalAlign: 'middle'}}>
                <div className='m-auto' style={{ maxWidth:'530px'}}>
                    <img alt={'firestorm'} src={logo} width="70%" height="70%" className='mb-5'/>

                    <h1 className='h1 mb-5 fw-normal'>Авторизация в панели управления телеграмм ботом</h1>
                    <TelegramLoginButton
                        dataOnauth={handleTelegramResponse}
                        botName="pokerhub_robot"
                        buttonSize='large'
                        lang="ru"
                        usePic={false}
                    />
                    <p className='mt-5 mb-3 h6' >
                        Designed by <a className='btn btn-outline-light' style={{marginInline:'5px'}} href="https://t.me/TraceNull">Fervuld</a> for PokerHub
                    </p>
                </div>
            </div>
        </div>
    );
}
export default Login;