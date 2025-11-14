import Message from './Message';

const Messages = ({ messages, chat_id, file_server }) => {
    return (
        <>
            {messages?.filter(message => message.content !== null && message.content !== '').map(message => (
                <Message key={message.id} message={message} chat_id={chat_id} file_server={file_server} />
            ))}
        </>
    );
};

export default Messages;