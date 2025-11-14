import { useContext } from "react";
import { authContext } from "../Context";
import { apiUrl } from '../../config';

const Message = ({ message, chat_id, file_server }) => {
    const { User } = useContext(authContext);
    const fromUser = message.author_id === chat_id;

    // Если это системное сообщение
    if (message.author_id === "system") {
        const styles = {
            width: '100%',
            height: '0',
            border: '1px solid #919191',
            margin: '3px',
            display: 'inline-block'
        };
        return (
            <li className="mb-4">
                <div className="divider d-flex align-items-center mb-4 text-center">
                    <div style={styles}></div>
                    <p className="text-center mx-3 mb-0 w-100" style={{ color: '#919191' }}>{message.date}<br />{message.text}</p>
                    <div style={styles}></div>
                </div>
            </li>
        );
    }

    // Обработка различных типов сообщений
    const renderContent = () => {
        const fileUrl = `${file_server}/files/${message.name}`;
        switch (message.type) {
            case 'text':
                return <p className="mb-0">{message.content}</p>;
            case 'video':
                return <video width="250" controls><source src={fileUrl} type="video/mp4" /></video>;
            case 'photo':
                return <img src={fileUrl} alt="photo" style={{ maxWidth: '250px' }} />;
            case 'audio':
            case 'voice':
                return <audio controls><source src={fileUrl} type="audio/mpeg" /></audio>;
            case 'document':
                return <a href={fileUrl} download>{message.content}</a>;
            default:
                return <p className="mb-0">{message.content}</p>;
        }
    };

    return (
        <li className="d-flex justify-content-between mb-4">
            {fromUser && <img
                src={message.user_picture.startsWith('http') ? message.user_picture : `${apiUrl}/static/img/avatars/${message.user_picture}`}
                className="rounded-circle d-flex align-self-start m-3 shadow-1-strong"
                width="60"
            />}
            <div className="card w-100">
                <div className="card-header d-flex justify-content-between p-3">
                    <p className="fw-bold mb-0">{message.username?.trim() ? message.username : message.author_id}</p>
                    <p className="text-muted small mb-0"><i className="far fa-clock"></i> {message.date}</p>
                </div>
                <div className="card-body">
                    {renderContent()}
                </div>
            </div>
            {/* Если это сообщение не от юзера */}
            {!fromUser && <img
                src={message.author_id === "-1" ? `${apiUrl}/static/img/avatars/${message.user_picture}` : `${apiUrl}/static/img/avatars/jivosite.jpg`}
                className="rounded-circle d-flex align-self-start m-3 shadow-1-strong"
                width="60"
            />}
        </li>
    );
};

export default Message;