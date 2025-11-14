import axios from "axios";
import React, {useContext} from "react";
import {NavLink} from "react-router-dom";

import {apiUrl, routes} from "../config";
import {authContext} from "./Context";
import {getAuthCookie, isAuth} from "../modules";
import logo from "../static/logo.svg";

const Navbar = () => {
    const {User, setUser} = useContext(authContext)

    function logout() {
        axios.get(apiUrl + '/auth/logout', getAuthCookie())
        window.localStorage.removeItem('hash')
        setUser({})
    }
    console.log('Navbar render', User)
    return (
        <nav className='navbar navbar-expand-lg navbar-dark' style={{backgroundColor:'#22222a'}}>
            <div className="container-fluid">
                <NavLink to={'/'} className={'nav-brand'}>
                    <img alt={'firestorm'} src={logo} width="128px" height="48px" className=' navbar-brand'/>
                </NavLink>

                <button className="navbar-toggler" type="button" data-bs-toggle="collapse"
                        data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent"
                        aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarSupportedContent">
                    <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                        {routes.map((route, index) => {
                            if (isAuth(User, route) && route.navbar) {
                                return (
                                    <li className="nav-item" key={index}>
                                        <NavLink to={route.link} className={'nav-link'}>{route.title}</NavLink>
                                    </li>
                                )
                            }
                        })}


                    </ul>
                    <button className="btn btn-outline-light" onClick={logout}>Выйти</button>
                </div>
            </div>
        </nav>
    )
}
export default Navbar;