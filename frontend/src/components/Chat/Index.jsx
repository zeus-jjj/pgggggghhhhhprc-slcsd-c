import Messages from './Messages';
import { useParams } from "react-router-dom";
import { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import { apiUrl } from "../../config";
import { getAuthCookie } from "../../modules";
import { authContext } from "../Context";
import InfiniteScroll from 'react-infinite-scroll-component';

const Index = () => {
    const chat_id = useParams().id;
    const [chat, setChat] = useState({ messages: [], total_count: 0, file_server: '' });
    const { User } = useContext(authContext);
    const [skip, setSkip] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const messagesContainerRef = useRef(null);
    const totalCountRef = useRef(chat.total_count);

    // Fetch chat data
    const fetchChat = async (newSkip = 0, append = false) => {
        setLoading(true);
        try {
            const resp = await axios.get(`${apiUrl}/messages_history/get-chat/${chat_id}?skip=${newSkip}`, getAuthCookie());

            setChat(prevChat => {
                const messages = append ? [...resp.data.messages, ...prevChat.messages] : resp.data.messages;

                return {
                    ...prevChat,
                    messages: messages,
                    total_count: resp.data.total_count,
                    creator_id: resp.data.creator_id,
                    file_server: resp.data.file_server
                };
            });

            // Update skip to reflect the total number of messages loaded
            setSkip(prevSkip => prevSkip + resp.data.messages.length);

            if (resp.data.messages.length < 20) {
                setHasMore(false);
            }
        } catch (error) {
            console.error("Error fetching chat: ", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Initial fetch
        fetchChat(0).then(() => {
            // After initial fetch, scroll to bottom
            setTimeout(() => {
                if (messagesContainerRef.current) {
                    messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
                }
            }, 0);
        });
    }, [chat_id]);

    // Update totalCountRef whenever chat.total_count changes
    useEffect(() => {
        totalCountRef.current = chat.total_count;
    }, [chat.total_count]);

    // Set up interval to check for new messages every 4 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            checkForNewMessages();
        }, 4000);

        return () => clearInterval(interval);
    }, [chat_id]);

    // Function to check for new messages
    const checkForNewMessages = async () => {
        try {
            const resp = await axios.get(`${apiUrl}/messages_history/get-total-msg/${chat_id}?total=${totalCountRef.current}`, getAuthCookie());

            setChat(prevChat => {
                // Create a Set of existing message IDs
                const existingMessageIds = new Set(prevChat.messages.map(msg => msg.id));

                // Filter out messages that are already in chat.messages
                const newMessages = resp.data.messages ? resp.data.messages.filter(msg => !existingMessageIds.has(msg.id)) : [];

                let updatedMessages = prevChat.messages;
                if (newMessages.length > 0) {
                    updatedMessages = [...prevChat.messages, ...newMessages];
                    // Update totalCountRef
                    totalCountRef.current = resp.data.total_count;
                    // Update skip to reflect the total number of messages loaded
                    setSkip(updatedMessages.length);
                }

                return {
                    ...prevChat,
                    messages: updatedMessages,
                    total_count: resp.data.total_count || prevChat.total_count,
                    file_server: resp.data.file_server
                };
            });

            // Scroll to bottom when new messages arrive
            if (messagesContainerRef.current && resp.data.messages && resp.data.messages.length > 0) {
                setTimeout(() => {
                    messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
                }, 0);
            }
        } catch (error) {
            console.error("Error fetching new messages: ", error);
        }
    };

    // Handle scroll to top for loading more messages
    const handleScroll = () => {
        if (messagesContainerRef.current) {
            if (messagesContainerRef.current.scrollTop === 0 && hasMore && !loading) {
                const previousScrollHeight = messagesContainerRef.current.scrollHeight;
                fetchMoreMessages().then(() => {
                    if (messagesContainerRef.current) {
                        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight - previousScrollHeight;
                    }
                });
            }
        }
    };

    // Fetch more messages when scrolling up
    const fetchMoreMessages = async () => {
        if (hasMore && !loading) {
            await fetchChat(skip, true);
        }
    };

    return (
        <main className="align-content-center mx-auto" style={{ maxWidth: '900px', maxHeight: '90vh' }}>
            <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                <h2 className="h2">Диалог #{chat_id} от {chat.messages?.length && chat?.messages[0]?.username}</h2>
            </div>
            {/* This div is the fixed container for the scrollable messages */}
            <div
                className="container"
                id="messages-container"
                style={{ position: 'relative', height: '70vh', overflow: 'auto' }}
                ref={messagesContainerRef}
                onScroll={handleScroll}
            >
                {/* InfiniteScroll handles the scrolling within this fixed height container */}
                <InfiniteScroll
                    dataLength={chat.messages.length}
                    next={fetchMoreMessages}
                    hasMore={hasMore}
                    inverse={true}
                    loader={loading && <span>Загрузка...</span>}
                    scrollableTarget="messages-container"
                    style={{ display: 'flex', flexDirection: 'column-reverse' }}
                >
                    <ul className="list-unstyled" id="messages">
                        <Messages messages={chat.messages} chat_id={chat_id} file_server={chat.file_server} />
                    </ul>
                </InfiniteScroll>
            </div>
        </main>
    );
};

export default Index;