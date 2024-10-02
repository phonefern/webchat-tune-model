// Drawer.jsx
import React, { useState, useEffect, useRef } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy, updateDoc  } from "firebase/firestore";
import { auth, db } from '../firebase'; // Firebase auth
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
const Drawer = ({ isOpen, newChatTitle, setNewChatTitle, chatItems, setChatItems, toggleDrawer, activeChatId, setIsLoading, handleChatClick }) => {

    const user = auth.currentUser;
    const navigate = useNavigate();
    const [openMenuChatId, setOpenMenuChatId] = useState(null);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
    const [editingChatId, setEditingChatId] = useState(null);
    const [editedChatTitle, setEditedChatTitle] = useState('');

    const toggleMenu = (chatId, e) => {
        e.stopPropagation();

        const rect = e.target.getBoundingClientRect();
        setMenuPosition({ x: rect.left + window.scrollX, y: rect.top + rect.height + window.scrollY });

        setOpenMenuChatId(openMenuChatId === chatId ? null : chatId);
    };

    const closeMenu = () => {
        setOpenMenuChatId(null);
    };

    


    const deleteChat = async (id) => {
        if (user) {
            try {

                // await new Promise((resolve) => setTimeout(resolve, 2000));
                await deleteDoc(doc(db, `users/${user.uid}/chats`, id));


                setChatItems((prevChatItems) => prevChatItems.filter(chat => chat.id !== id));

                if (activeChatId === id) {
                    setActiveChatId(true);
                    setMessages([]);
                }

                // setActiveChatId(null);
                // setMessages([]); 


                setIsLoading(false);
            } catch (error) {
                console.error("Error deleting chat: ", error);
            }
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.option-chat') && !event.target.closest('.fa-ellipsis-vertical')) {
                closeMenu();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);



    const handleOptionChat = (option, e) => {
        e.stopPropagation();
        if (option === 'Edit') {
            console.log('Edit selected for chat:', openMenuChatId);
    
            const chatToEdit = chatItems.find(chat => chat.id === openMenuChatId);
    
            if (chatToEdit) {
               
                setEditingChatId(openMenuChatId);
                setEditedChatTitle(chatToEdit.title); 
            }
        } else if (option === 'Delete') {
            deleteChat(openMenuChatId); 
        }
    
        closeMenu(); 
    };
    

    const addNewChat = async () => {
        if (newChatTitle.trim() && user) {
            const currentDate = new Date();
            const newChat = {
                title: newChatTitle,
                date: currentDate,
                isActive: false,
                isRecent: true
            };

            // Calculate if the chat is recent (within the last day)
            const now = new Date();
            const diffDays = (now - currentDate) / (1000 * 60 * 60 * 24);
            newChat.isRecent = diffDays <= 1;

            console.log(`Adding chat for user: ${user.uid} at path: users/${user.uid}/chats`);

            try {
                const docRef = await addDoc(collection(db, `users/${user.uid}/chats`), newChat);
                setChatItems([{ id: docRef.id, ...newChat }, ...chatItems]);
                setNewChatTitle('');
            } catch (error) {
                console.error("Error adding chat: ", error);
            }
        }
    };

    const drawerRef = useRef(null);

    const handleEditClick = (chatId, currentTitle) => {
        setEditingChatId(chatId);
        setEditedChatTitle(currentTitle);
    };

    const updateChatTitle = async (chatId) => {
        if (editedChatTitle.trim() === '') return; 

        try {
         
            const chatDocRef = doc(db, `users/${user.uid}/chats`, chatId);
            await updateDoc(chatDocRef, { title: editedChatTitle });

        
            setChatItems(chatItems.map(chat =>
                chat.id === chatId ? { ...chat, title: editedChatTitle } : chat
            ));

          
            setEditingChatId(null);
            setEditedChatTitle('');
        } catch (error) {
            console.error('Error updating chat title:', error);
        }
    };

    const handleClickOutside = (event) => {
        if (drawerRef.current && !drawerRef.current.contains(event.target)) {
            if (editingChatId) {
                updateChatTitle(editingChatId);
            }
        }
    };

    const handleKeyDown = (event, chatId) => {
        if (event.key === 'Enter') {
            updateChatTitle(chatId);
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [editingChatId]);



    const deleteSubcollection = async (userId) => {
        const chatsCollection = collection(db, `users/${userId}/chats`);
        const chatsSnapshot = await getDocs(chatsCollection);

        for (const chatDoc of chatsSnapshot.docs) {
            const messagesCollection = collection(chatsCollection, chatDoc.id, 'messages');
            const messagesSnapshot = await getDocs(messagesCollection);


            for (const messageDoc of messagesSnapshot.docs) {
                await deleteDoc(doc(messagesCollection, messageDoc.id));
            }


            await deleteDoc(doc(chatsCollection, chatDoc.id));
        }
    };


    const handleLogout = async () => {
        try {
            const user = auth.currentUser;

            if (user && user.isAnonymous) {

                await deleteSubcollection(user.uid);
                const userDocRef = doc(db, `users/${user.uid}`);
                await deleteDoc(userDocRef)
                await user.delete();
            }

            // Sign out the user
            await signOut(auth);
            navigate('/');
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };




    return (
        <div className={`drawer ${isOpen ? 'open' : ''}`}>
            <div className="menu-icon" onClick={toggleDrawer}>
                <i className="fa-solid fa-bars"></i>
            </div>
            <div className="drawer-header">
                <div className="top-drawer">
                    <img src="../img/bhh_logo.png" alt="Bangkok Hospital Logo" className="drawer-logo" />
                </div>

                <input
                    type="text"
                    value={newChatTitle}
                    onChange={(e) => setNewChatTitle(e.target.value)}
                    placeholder="Enter new chat title"
                    className="new-chat-input"
                />
                <button className="new-chat-btn" onClick={addNewChat}>+ New chat</button>
            </div>
            {/* Chat History */}
            <div className="drawer-content">
                <div className="drawer-setting">
                    <h3>Recent</h3>
                    {chatItems.filter(chat => chat.isRecent).map(chat => (
                        <div
                            key={chat.id}
                            className={`chat-item ${chat.isActive ? 'active' : ''}`}
                            onClick={() => handleChatClick(chat.id)}
                        >
                            {editingChatId === chat.id ? (
                                <input
                                    type="text"
                                    value={editedChatTitle}
                                    onChange={(e) => setEditedChatTitle(e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(e, chat.id)} 
                                    autoFocus 
                                    onBlur={() => updateChatTitle(chat.id)} 
                                />
                            ) : (
                                <div onClick={() => handleEditClick(chat.id, chat.title)}>
                                    {chat.title}
                                </div>
                            )}


                            <div
                                className="icon-container"
                                onClick={(e) => toggleMenu(chat.id, e)}
                            >
                                <i className="fa-solid fa-ellipsis-vertical"></i>
                            </div>

                            {openMenuChatId === chat.id && (
                                <div
                                    className="option-chat"
                                    style={{ position: 'absolute', top: `${menuPosition.y}px`, left: `${menuPosition.x}px` }}
                                    onClick={(e) => e.stopPropagation()}  
                                    >
                                        <p onClick={(e) => handleOptionChat("Edit", e)}>Edit</p>  
                                        <p onClick={(e) => handleOptionChat("Delete", e)}>Delete</p>  
                                    </div>
                            )}
                        </div>
                    ))}

                    <h3>Yesterday</h3>
                    {chatItems.filter(chat => !chat.isRecent && chat.date > (new Date().getTime() - (1000 * 60 * 60 * 24 * 2))).map(chat => (
                        <div
                        key={chat.id}
                        className={`chat-item ${chat.isActive ? 'active' : ''}`}
                        onClick={() => handleChatClick(chat.id)}
                    >
                        {editingChatId === chat.id ? (
                            <input
                                type="text"
                                value={editedChatTitle}
                                onChange={(e) => setEditedChatTitle(e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, chat.id)} 
                                autoFocus 
                                onBlur={() => updateChatTitle(chat.id)} 
                            />
                        ) : (
                            <div onClick={() => handleEditClick(chat.id, chat.title)}>
                                {chat.title}
                            </div>
                        )}


                        <div
                            className="icon-container"
                            onClick={(e) => toggleMenu(chat.id, e)}
                        >
                            <i className="fa-solid fa-ellipsis-vertical"></i>
                        </div>

                        {openMenuChatId === chat.id && (
                            <div
                                className="option-chat"
                                style={{ position: 'absolute', top: `${menuPosition.y}px`, left: `${menuPosition.x}px` }}
                                onClick={(e) => e.stopPropagation()}  
                                >
                                    <p onClick={(e) => handleOptionChat("Edit", e)}>Edit</p>  
                                    <p onClick={(e) => handleOptionChat("Delete", e)}>Delete</p>  
                                </div>
                        )}
                    </div>

                    ))}

                    <h3>7 Days Before</h3>
                    {chatItems.filter(chat =>
                        !chat.isRecent &&
                        chat.date <= (new Date().getTime() - (1000 * 60 * 60 * 24 * 2)) &&
                        chat.date > (new Date().getTime() - (1000 * 60 * 60 * 24 * 7))
                    ).map(chat => (
                        <div
                            key={chat.id}
                            className={`chat-item ${chat.isActive ? 'active' : ''}`}
                            onClick={() => handleChatClick(chat.id)}
                        >
                            {editingChatId === chat.id ? (
                                <input
                                    type="text"
                                    value={editedChatTitle}
                                    onChange={(e) => setEditedChatTitle(e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(e, chat.id)} 
                                    autoFocus 
                                    onBlur={() => updateChatTitle(chat.id)} 
                                />
                            ) : (
                                <div onClick={() => handleEditClick(chat.id, chat.title)}>
                                    {chat.title}
                                </div>
                            )}


                            <div
                                className="icon-container"
                                onClick={(e) => toggleMenu(chat.id, e)}
                            >
                                <i className="fa-solid fa-ellipsis-vertical"></i>
                            </div>

                            {openMenuChatId === chat.id && (
                                <div
                                    className="option-chat"
                                    style={{ position: 'absolute', top: `${menuPosition.y}px`, left: `${menuPosition.x}px` }}
                                    onClick={(e) => e.stopPropagation()}  
                                    >
                                        <p onClick={(e) => handleOptionChat("Edit", e)}>Edit</p>  
                                        <p onClick={(e) => handleOptionChat("Delete", e)}>Delete</p>  
                                    </div>
                            )}
                        </div>
                    ))}

                    {/* Footer */}
                    <div className="drawer-footer">
                        {/* <div className="footer-item">Help</div> */}
                        {/* <div className="footer-item">Settings</div> */}
                        <div className="footer-item" onClick={handleLogout}>Logout</div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Drawer;
