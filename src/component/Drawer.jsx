// Drawer.jsx
import React, { useState, useEffect, useRef } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy, updateDoc } from "firebase/firestore";
import { auth, db } from '../firebase'; // Firebase auth
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
const Drawer = ({ isOpen, newChatTitle, setNewChatTitle, chatItems, setChatItems, toggleDrawer, handleChatClick, handleOptionChat, openMenuChatId, setOpenMenuChatId, editingChatId, editedChatTitle, setEditedChatTitle, setEditingChatId, isDeleteModalOpen, setIsDeleteModalOpen, confirmDeleteChat, setIsOpen }) => {

    const user = auth.currentUser;
    const navigate = useNavigate();
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
    const [isModalsettingOpen, setIsModalsettingOpen] = useState(false);
    const [isModalhelpOpen, setIsModalhelpOpen] = useState(false);
    const [theme, setTheme] = useState("light");
    

    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
    };



    const handleHelp = () => {
        setIsOpen(false);
        setIsModalhelpOpen((prev) => !prev);
    };

    const toggleModalsetting = () => {
        setIsOpen(false);
        setIsModalsettingOpen((prev) => !prev);
    };

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
        <div>
            <div className={`drawer relative h-full w-64 bg-white shadow-lg ${isOpen ? 'open' : ''}`}>
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
                        <h3 style={{ fontWeight: 'bold' }}>Recent</h3>
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
                                        style={{ position: 'fixed', top: `${menuPosition.y}px`, left: `${menuPosition.x}px` }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <p onClick={(e) => handleOptionChat("Edit", e)}>Edit</p>
                                        <p onClick={(e) => handleOptionChat("Delete", e)}>Delete</p>
                                    </div>
                                )}
                            </div>
                        ))}

                        <h3 style={{ fontWeight: 'bold' }}>Yesterday</h3>
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
                                        style={{ position: 'fixed', top: `${menuPosition.y}px`, left: `${menuPosition.x}px` }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <p onClick={(e) => handleOptionChat("Edit", e)}>Edit</p>
                                        <p onClick={(e) => handleOptionChat("Delete", e)}>Delete</p>
                                    </div>
                                )}
                            </div>

                        ))}

                        <h3 style={{ fontWeight: 'bold' }}>7 Days Before</h3>
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
                                        style={{ position: 'fixed', top: `${menuPosition.y}px`, left: `${menuPosition.x}px` }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <p onClick={(e) => handleOptionChat("Edit", e)}>Edit</p>
                                        <p onClick={(e) => handleOptionChat("Delete", e)}>Delete</p>
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Footer */}
                        <div className="drawer-footer absolute bottom-0 left-0 w-full p-4  border-t border-gray-200">
                            <div className="footer-item flex items-center cursor-pointer text-gray-700 hover:text-black mb-2" onClick={toggleModalsetting}>
                                <i className="fa-solid fa-gear"></i>
                                <span className="ml-2">Settings</span>
                            </div>
                            <div className="footer-item flex items-center cursor-pointer text-gray-700 hover:text-black mb-2" onClick={handleHelp}>
                                <i className="fa-solid fa-circle-question"></i>
                                <span className="ml-2">Help</span>
                            </div>
                            <div className="footer-item flex items-center cursor-pointer text-gray-700 hover:text-black" onClick={handleLogout}>
                                <i className="fa-solid fa-right-from-bracket"></i>
                                <span className="ml-2">Logout</span>
                            </div>
                        </div>


                    </div>

                </div>
            </div>

            {isDeleteModalOpen && (
                <div className="p-4 w-full fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                        <p className="text-lg d justify-between border-b pb-2 mb-4">
                            Are you sure you want to delete the chat ?
                        </p>
                        <div className="flex justify-around mt-6">
                            <button
                                className="py-2 px-3 text-sm font-medium text-center text-white bg-red-600 rounded-lg hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300 dark:bg-red-500 dark:hover:bg-red-600 dark:focus:ring-red-900"
                                onClick={() => confirmDeleteChat()}
                            >
                                Yes, Delete
                            </button>
                            <button
                                className="py-2 px-3 text-sm font-medium text-gray-500 bg-white rounded-lg border border-gray-200 hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-primary-300 hover:text-gray-900 focus:z-10 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-600 rounded-xl"
                                onClick={() => setIsDeleteModalOpen(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <>
                {isModalsettingOpen && (
                    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-96 relative">

                            {/* Header */}
                            <div className="flex items-center justify-between border-b pb-2 mb-4">
                                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">การตั้งค่า</h2>
                                <button
                                    onClick={toggleModalsetting}
                                    className="close-button2"
                                >
                                    <i className="fa-solid fa-xmark"></i>
                                </button>
                            </div>



                            {/* Settings Options */}
                            <div className="space-y-4">

                                {/* Theme Dropdown */}
                                <div className="flex items-center justify-between">
                                    <label className="text-gray-800 dark:text-gray-300">ธีม</label>
                                    <select
                                        className="border rounded px-2 py-1 dark:bg-gray-700 dark:text-gray-200"
                                        value={theme}
                                        onChange={(e) => setTheme(e.target.value)}
                                    >
                                        <option value="light">สว่าง</option>
                                        <option value="dark">มืด</option>
                                    </select>
                                </div>

                                {/* Toggle Option */}
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-800 dark:text-gray-300">แสดงโค้ดเสมือนมือ</span>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only" />
                                        <div className="w-10 h-5 bg-gray-200 rounded-full peer dark:bg-gray-600">
                                            <div className="dot absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5 dark:bg-gray-300"></div>
                                        </div>
                                    </label>
                                </div>

                                {/* Language Dropdown */}
                                <div className="flex items-center justify-between">
                                    <label className="text-gray-800 dark:text-gray-300">ภาษา</label>
                                    <select className="border rounded px-2 py-1 dark:bg-gray-700 dark:text-gray-200">
                                        <option>ตรวจจับอัตโนมัติ</option>
                                        <option>ภาษาไทย</option>
                                        <option>ภาษาอังกฤษ</option>
                                    </select>
                                </div>

                                {/* Manage Chat */}
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-800 dark:text-gray-300">แชทที่เก็บถาวร</span>
                                    <button className="px-4 py-1 bg-gray-100 text-gray-700 rounded dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 hover:dark:bg-gray-600">จัดการ</button>
                                </div>

                                {/* Clear All Chats */}
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-800 dark:text-gray-300">ลบแชททั้งหมด</span>
                                    <button className="px-4 py-1 bg-red-500 text-white rounded hover:bg-red-600">ลบทิ้งหมด</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {isModalhelpOpen && (
                    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-96 relative">
                            {/* ส่วนหัวของ Modal */}
                            <div className="flex items-center justify-between border-b pb-2 mb-4">
                                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Help - Askmedi Chatbot AI</h2>

                                {/* ปุ่มปิด Modal */}
                                <button
                                    onClick={() => setIsModalhelpOpen(false)}
                                    className="close-button2"
                                >
                                    <i className="fa-solid fa-xmark"></i>
                                </button>
                            </div>

                            {/* เนื้อหาใน Modal */}
                            <p className="text-gray-500 dark:text-gray-300 mb-4">
                                ยินดีต้อนรับสู่ระบบช่วยเหลือของ  Chatbot AI!
                            </p>
                            <p className="text-gray-600 dark:text-gray-300 mb-6">
                                คุณสามารถถามคำถามที่เกี่ยวข้องกับการใช้งานระบบได้ หรือใช้คำสั่งต่าง ๆ เพื่อรับคำตอบที่รวดเร็วและมีประโยชน์ ตัวอย่างคำสั่งที่สามารถใช้ได้เช่น:
                            </p>

                            <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 mb-6 space-y-2">
                                <li><strong>How to use:</strong> ถามเกี่ยวกับวิธีการใช้งานฟีเจอร์ต่าง ๆ</li>
                                <li><strong>Account issues:</strong> แจ้งปัญหาหรือสอบถามเกี่ยวกับบัญชีของคุณ</li>
                                <li><strong>Settings:</strong> ขอคำแนะนำเกี่ยวกับการตั้งค่า Chatbot</li>
                            </ul>

                            <p className="text-gray-600 dark:text-gray-300 mb-6">
                                เราพร้อมที่จะช่วยเหลือคุณ หากมีข้อสงสัยสามารถติดต่อทีมสนับสนุนได้ตลอดเวลา!
                            </p>


                        </div>
                    </div>
                )}
            </>
        </div >
    );
};

export default Drawer;
