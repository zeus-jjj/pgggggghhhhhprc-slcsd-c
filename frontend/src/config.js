import React from "react";

import MessagesHistory from './components/MessagesHistory/Messages.jsx'
import TicketChat from './components/Chat/Index.jsx'
import Users from './components/Users/Users.jsx'
import Profile from "./components/Profile/Index.jsx";
import Alerts from "./components/Alerts/Index";
import UsersData from "./components/UsersData/Index";
import PokerhubStats from "./components/PokerhubStats/pokerhub_stats";
import CourseProgress from "./components/PHCourseMovement/Index";

// export const apiUrl = 'https://telegram.firestorm.team/api'
export const apiUrl = 'https://telegram.pokerhub.pro/api'

export const ticket_statuses = {
    'new': 'Новый',
    'active': 'В работе',
    'closed': 'Закрыт'
}
export const profile_cards = [
    {'name': 'ID', 'key': 'id'},
    {'name': 'Почта', 'key': 'email'},
    {'name': 'Дата регистрации', 'key': 'create_at'},
]

export const routes = [
    {
        title: 'История сообщений',
        module: <MessagesHistory/>,
        link: '/msg_history',
        roles: [1, 2, 3],
        navbar: true},
    {
        title: 'Сообщения',
        module: <TicketChat/>,
        link: '/msg_history',
        link_params: ['id'],
        roles: [1, 2, 3]
    },
    {
        title: 'Уведомления',
        module: <Alerts/>,
        link: '/alerts',
        roles: [1,2],
        navbar: true
    },
    {
        title: 'Пользователи',
        module: <Users/>,
        link: '/users',
        roles: [1],
        navbar: true
    },
    {
        title: 'Профиль пользователя',
        module: <Profile/>,
        link: '/profile',
        link_params: ['id'],
        roles: [1, 2, 3],
        navbar: false
    },
    {
        title: 'Фильтр юзеров',
        module: <UsersData/>,
        link: '/users_data',
        roles: [1, 2],
        navbar: true
    },
    {
        title: 'Статистика PH',
        module: <PokerhubStats/>,
        link: '/ph_stats',
        roles: [1, 2],
        navbar: true
    },
    {
        title: 'PH движение по урокам',
        module: <CourseProgress/>,
        link: '/ph_course_progress',
        roles: [1, 2],
        navbar: true
    }
]
