import Picker from 'emoji-picker-react';
import { useState, useContext, useEffect } from "react";
import { useParams } from "react-router-dom";
import { authContext } from "../Context";

import { ReactComponent as Smile } from "../../icons/emoji-smile-fill.svg";
import { ReactComponent as SendFill } from "../../icons/send-fill.svg";
import axios from "axios";
import { getAuthCookie } from "../../modules";
import { apiUrl } from "../../config";

const Send = ({ chat, setChat }) => {
    const ticket_id = useParams().id;
    const { User } = useContext(authContext);
    const [message, setMessage] = useState({
        text: '',
        files: []
    });
    const [pickerVisible, setPickerVisible] = useState(false);
    const [isUserInChat, setIsUserInChat] = useState(false);

    const onEmojiClick = (emojiObject, event) => {
        setMessage(msg => ({
            ...msg,
            text: msg.text + emojiObject.emoji,
        }));
    };

    
    // Show the message input area
    return (
        <div className='mb-2 fixed-bottom'>
            <div className='mx-auto' style={{ maxWidth: '900px' }}>
                {pickerVisible && (
                    <div style={{ position: 'absolute', right: '1000px', bottom: '150px' }}>
                        <Picker onEmojiClick={onEmojiClick} />
                    </div>
                )}

                <div className="card-footer text-muted d-flex justify-content-start align-items-center px-3 border rounded-3">
                    <a className={`m-2 ${!pickerVisible && "text-muted"}`} href="#" onClick={(e) => {
                        e.preventDefault();
                        setPickerVisible(state => !state);
                    }}>
                        <Smile />
                    </a>
                </div>
            </div>
        </div>
    );

};

export default Send;
