// Drawer.jsx
import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy } from "firebase/firestore";
import { auth, db } from '../firebase'; // Firebase auth
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
const Drawer = ({ isOpen, newChatTitle, setNewChatTitle, chatItems, setChatItems, handleChatClick, deleteChat }) => {

    const user = auth.currentUser;
    const navigate = useNavigate();
    const [openMenuChatId, setOpenMenuChatId] = useState(null);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

    const toggleMenu = (chatId, e) => {
        e.stopPropagation();

        const rect = e.target.getBoundingClientRect();
        setMenuPosition({ x: rect.left + window.scrollX, y: rect.top + rect.height + window.scrollY });

        setOpenMenuChatId(openMenuChatId === chatId ? null : chatId);
    };

    const closeMenu = () => {
        setOpenMenuChatId(null);
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



    const handleOptionChat = (option) => {
        if (option === 'Edit') {
            console.log('Edit selected for chat:', openMenuChatId);
            // Add edit logic here
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



    const deleteSubcollection = async (userId) => {
        const chatsCollection = collection(db, `users/${userId}/chats`);
        const chatsSnapshot = await getDocs(chatsCollection);

        for (const chatDoc of chatsSnapshot.docs) {
            const messagesCollection = collection(chatsCollection, chatDoc.id, 'messages');
            const messagesSnapshot = await getDocs(messagesCollection);

            // Loop through each message document and delete
            for (const messageDoc of messagesSnapshot.docs) {
                await deleteDoc(doc(messagesCollection, messageDoc.id));
            }

            // Now delete the chat document itself
            await deleteDoc(doc(chatsCollection, chatDoc.id));
        }
    };

    // Function to handle logout
    const handleLogout = async () => {
        try {
            const user = auth.currentUser; // Get the currently signed-in user

            if (user && user.isAnonymous) {

                await deleteSubcollection(user.uid);
                const userDocRef = doc(db, `users/${user.uid}`);
                await deleteDoc(userDocRef)
                await user.delete();
            }

            // Sign out the user
            await signOut(auth);
            navigate('/'); // Redirect to login page after sign out
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };




    return (
        <div className={`drawer ${isOpen ? 'open' : ''}`}>



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
                            {chat.title}
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
                                >
                                    <p onClick={() => handleOptionChat("Edit")}>Edit</p>
                                    <p onClick={() => handleOptionChat("Delete")}>Delete</p>
                                </div>
                            )}
                        </div>
                    ))}

                    <h3>Yesterday</h3>
                    {chatItems.filter(chat => !chat.isRecent && chat.date > (new Date().getTime() - (1000 * 60 * 60 * 24 * 2))).map(chat => (
                        <div
                            key={chat.id}
                            className={`chat-item ${chat.isActive ? 'active' : ''}`}
                            onClick={() => handleChatClick(chat.id)} // Set active on click
                        >
                            {chat.title}
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
                                >
                                    <p onClick={() => handleOptionChat("Edit")}>Edit</p>
                                    <p onClick={() => handleOptionChat("Delete")}>Delete</p>
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
                            onClick={() => handleChatClick(chat.id)} // Set active on click
                        >
                            {chat.title}
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
                                >
                                    <p onClick={() => handleOptionChat("Edit")}>Edit</p>
                                    <p onClick={() => handleOptionChat("Delete")}>Delete</p>
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
