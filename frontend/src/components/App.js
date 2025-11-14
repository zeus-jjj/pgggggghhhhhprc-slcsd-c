import axios from "axios";
import { Routes, Route, Navigate } from "react-router-dom";
import React, { useEffect, useState } from "react";

import { apiUrl } from "../config";
import { authContext } from './Context';
import { getAuthCookie, isAuth, notifyMe, create_socket } from "../modules";

import Login from "./Login";
import Navbar from "./Navbar";
import LoadingPage from "./LoadingPage";

import { routes } from "../config";

function App() {
    const [loading, setLoading] = useState(true);
    const [User, setUser] = useState({});

    useEffect(() => {
        const socket = create_socket('/notify');
        socket.on('connect', () => {
            console.log('connect');
        });
        socket.on('notify', (data) => {
            notifyMe({ ...data, icon: apiUrl + data.icon });
        });

        function notifySet() {
            console.log('qq');
            if (!("Notification" in window)) {
                alert('Ваш браузер не поддерживает HTML Notifications, его необходимо обновить.');
            } else if (Notification.permission !== "denied") {
                Notification.requestPermission((permission) => {
                    if (!('permission' in Notification))
                        Notification.permission = permission;
                });
            }
        }
        notifySet();

        axios.get(apiUrl + '/auth/me', getAuthCookie())
            .then(resp => {
                setUser(resp.data);
                setLoading(false);
            });
        return () => {
            socket.disconnect();
        };
    }, []);

    if (loading) {
        return <LoadingPage />;
    }
    
    const userAuth = (User.resultCode === 2 || Object.keys(User).length === 0);

    return (
        <div>
            <authContext.Provider value={{ User, setUser }}>
                {!userAuth && <Navbar />}
                <div className="container-fluid px-4">
                    <Routes>
                        {userAuth && <Route path="*" element={<Login />} />}
                        {/* Редирект с корневого маршрута на /tickets */}
                        <Route path="/" element={<Navigate to="/msg_history" replace />} />
                        {routes.map((route, index) => {
                            if (isAuth(User, route)) {
                                return (
                                    <Route 
                                        key={index} 
                                        element={route.module} 
                                        exact 
                                        path={
                                            route.link +
                                            (route.link_params?.length > 0 
                                                ? '/:' + route.link_params.join('/:') 
                                                : '')
                                        } 
                                    />
                                );
                            }
                            return null;
                        })}
                    </Routes>
                </div>
            </authContext.Provider>
        </div>
    );
}

export default App;
