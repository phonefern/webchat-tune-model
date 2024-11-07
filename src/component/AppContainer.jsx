// AppContainer.jsx
import React, { useState, useEffect, useRef } from "react";
import Header from '../component/Header';
import ThemeSwitcher from '../component/ThemeSwitcher';
import ChatContainer from '../component/ChatContainer';
import Drawer from '../component/Drawer';
import BackDrop from '../component/BackDrop';
import "../pages/App.css";
import "../component/Chatstyle.css"
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy, getDoc, Timestamp } from "firebase/firestore";
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import Typewriter from "typewriter-effect";
import { auth } from '../firebase'; // Firebase auth
import { storage, ref, uploadBytes, getDownloadURL } from '../firebase';

const AppContainer = () => {


    const [isOpen, setIsOpen] = useState(false);
    const [chatItems, setChatItems] = useState([]);
    const [newChatTitle, setNewChatTitle] = useState('');
    const [selectedModel, setSelectedModel] = useState("gemini-1.5-flash");
    const [activeChatId, setActiveChatId] = useState(null);
    const [theme, setTheme] = useState("light");
    const [isLoading, setIsLoading] = useState(false);
    const user = auth.currentUser;
    const navigate = useNavigate();
    const [showGreeting, setShowGreeting] = useState(true);
    const [messages, setMessages] = useState([]);
    const [question, setQuestion] = useState("");
    const [animateHeaderLine, setAnimateHeaderLine] = useState(false);
  
    const [selectedFile, setSelectedFile] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [chatToDelete, setChatToDelete] = useState(null);
    const [openMenuChatId, setOpenMenuChatId] = useState(null);
    const [editingChatId, setEditingChatId] = useState(null);
    const [editedChatTitle, setEditedChatTitle] = useState('');
    const [isBotLoading, setIsBotLoading] = useState(false);

    const toggleTheme = () => {
        setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
    };

    const closeMenu = () => {
        setOpenMenuChatId(null);
    };

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
            const chatToDelete = chatItems.find(chat => chat.id === openMenuChatId);
            setChatToDelete(chatToDelete);
            setIsOpen(false);
            setIsDeleteModalOpen(true);
            console.log("test pass de")
        }

        closeMenu();
    };

    const confirmDeleteChat = () => {
        deleteChat(chatToDelete.id);
        setIsDeleteModalOpen(false);
        setChatToDelete(null);
    };


    const isRecent = (date) => {
        const now = new Date();
        const chatDate = new Date(date);
        const diffDays = (now - chatDate) / (1000 * 60 * 60 * 24);
        return diffDays <= 1;
    };

    // Load theme from localStorage
    useEffect(() => {
        const savedTheme = localStorage.getItem("theme");
        if (savedTheme) {
            setTheme(savedTheme);
        }
    }, []);

    useEffect(() => {
        
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 2000);

     
        return () => clearTimeout(timer);
    }, []);


    useEffect(() => {
        const fetchChats = async () => {
            if (!user) return;
            try {
                const chatCollection = collection(db, `users/${user.uid}/chats`);
                const chatSnapshot = await getDocs(chatCollection);
                const chatList = chatSnapshot.docs.map(doc => {
                    const chatData = doc.data();
                    return {
                        id: doc.id,
                        ...chatData,
                        isActive: false,
                        date: chatData.date && chatData.date.toDate(),
                        isRecent: isRecent(chatData.date ? chatData.date.toDate() : new Date()),
                    };
                });


                const sortedChatList = chatList.sort((a, b) => b.date - a.date);

                if (sortedChatList.length > 0) {
                    sortedChatList[0].isActive = true;
                    setActiveChatId(sortedChatList[0].id);
                }

                setChatItems(sortedChatList);
            } catch (error) {
                console.error("Error fetching chats: ", error);
            }
        };

        fetchChats();
    }, [user]);


    // Fetch messages for the active chat
    useEffect(() => {
        if (activeChatId && user) {
            const fetchMessages = async () => {
                try {
                    const messagesRef = collection(db, `users/${user.uid}/chats/${activeChatId}/messages`);

                    const messagesQuery = query(messagesRef, orderBy("timestamp", "asc"));

                    const messagesSnapshot = await getDocs(messagesQuery);

                    const messagesList = messagesSnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    setMessages(messagesList);
                } catch (error) {
                    console.error("Error fetching messages: ", error);
                }
            };

            fetchMessages();
        }
    }, [activeChatId, user]);

    const handleChatClick = async (id) => {
        if (activeChatId === id && messages.length > 0) {
            return;
        }
        setMessages([]);
        setIsLoading(true);
        setActiveChatId(id);

        setChatItems(chatItems.map(chat => ({
            ...chat,
            isActive: chat.id === id
        })));
        setIsOpen(close);
        await new Promise(resolve => setTimeout(resolve, 2000));
        try {
            const messagesCollection = collection(db, `users/${user.uid}/chats/${id}/messages`);
            const messagesQuery = query(messagesCollection, orderBy('timestamp', 'asc'));
            const messagesSnapshot = await getDocs(messagesQuery);
            const messagesList = messagesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMessages(messagesList);
        } catch (error) {
            console.error("Error fetching messages: ", error);
        } finally {
            setIsLoading(false);
        }
    };

    // console.log(isOpen);

    // Toggle drawer state
    const toggleDrawer = () => {
        setIsOpen(!isOpen);
    };

    const createNewChat = async () => {
        const newChatTitle = "Start Chat";
        if (user) {
            const currentDate = new Date();
            const newChat = {
                title: newChatTitle,
                date: currentDate,
                isActive: true
            };

            try {
                const docRef = await addDoc(collection(db, `users/${user.uid}/chats`), newChat);


                setChatItems((prevChatItems) => {
                    console.log("Updated chat items:", [{ id: docRef.id, ...newChat, isRecent: isRecent(currentDate) }, ...prevChatItems]);
                    return [{ id: docRef.id, ...newChat, isRecent: isRecent(currentDate) }, ...prevChatItems];
                });

                setActiveChatId(docRef.id);
                setIsLoading(false);
                return docRef.id;
            } catch (error) {
                console.error("Error creating new chat:", error);
            }
        }
    };

    // Function to add messages to Firestore (user or bot)
    const addMessageToChat = async (activeChatId, messageText, sender) => {

        if (!activeChatId || !user) return;
        try {
            const messagesCollection = collection(db, `users/${user.uid}/chats/${activeChatId}/messages`);
            const timestamp = new Date()
            const messageData = {
                text: messageText,
                sender,
                timestamp,
                // timeInThai: new Date(timestamp).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })
            };

            await addDoc(messagesCollection, messageData);
        } catch (error) {
            console.error("Error adding message to Firestore:", error);
        }
    };


    const formatBotMessage = (text) => {

        let cleanedText = text.replace(/\*/g, "").trim();


        cleanedText = cleanedText.replace(/\.\s*/g, '.\n');

        return cleanedText;
    };


    // const handleSendMessage = async (e) => {
    //     e.preventDefault();

    //     const userMessageText = question.trim();
    //     if (!userMessageText && !imageFile) {
    //         setMessages((prevMessages) => [...prevMessages, { sender: "error", text: "กรุณากรอกคำถามหรือเลือกไฟล์ภาพ!" }]);
    //         return;
    //     }

    //     let currentChatId = activeChatId;
    //     if (!currentChatId) {
    //         currentChatId = await createNewChat();
    //         setActiveChatId(currentChatId);
    //     }

    //     const userMessage = {
    //         sender: "user",
    //         text: userMessageText || "Uploaded an image",
    //         image: imagePreview ? imagePreview : null
    //     };
    //     addMessageToChat(currentChatId, userMessage.text, "user");

    //     setMessages((prevMessages) => [...prevMessages, userMessage]);

    //     setImagePreview(null);
    //     setQuestion('');
    //     setImageFile(null);

    //     try {

    //         const botLoadingMessage = { sender: "bot", text: "", isLoading: true };
    //         setMessages((prevMessages) => [...prevMessages, botLoadingMessage]);
    //         setIsBotLoading(true);

    //         let imageUrl = null;


    //         if (imageFile) {
    //             const storageRef = ref(storage, `images/${imageFile.name}`);
    //             await uploadBytes(storageRef, imageFile); 
    //             imageUrl = await getDownloadURL(storageRef); 
    //         }


    //         const formData = new FormData();
    //         formData.append('question', userMessageText || "What is this image?");
    //         if (imageUrl) {
    //             formData.append('imageUrl', imageUrl); 
    //         }
    //         console.log('Sending data:', { question: userMessageText, model: selectedModel, imageFile });

    //         formData.append('model', selectedModel);
    //         // const response = await fetch("https://gemini-image-api.vercel.app/api/ask-ai", {
    //         // const response = await fetch("https://geminiapi-flame.vercel.app/api/index", {
    //         const response = await fetch("http://localhost:3000/ask-ai", {
    //             method: "POST",
    //             body: formData,
    //         });

    //         const result = await response.json();
    //         setIsBotLoading(false);
    //         console.log(result)
    //         if (response.ok) {
    //             const botMessageText = formatBotMessage(result.answer || "No answer received");
    //             const botMessage = { sender: "bot", text: botMessageText, isLoading: false };


    //             setMessages((prevMessages) => {
    //                 const updatedMessages = [...prevMessages];
    //                 updatedMessages[updatedMessages.length - 1] = botMessage;
    //                 return updatedMessages;
    //             });

    //             addMessageToChat(currentChatId, botMessage.text, "bot");
    //         } else {
    //             const errorMessage = result.error || "Error occurred";

    //             setMessages((prevMessages) => {
    //                 const updatedMessages = [...prevMessages];
    //                 updatedMessages[updatedMessages.length - 1] = { sender: "error", text: errorMessage };
    //                 return updatedMessages;
    //             });
    //         }
    //     } catch (error) {
    //         console.error("Error:", error);
    //         setIsBotLoading(false);
    //         setMessages((prevMessages) => {
    //             const updatedMessages = [...prevMessages];
    //             updatedMessages[updatedMessages.length - 1] = { sender: "error", text: "Cannot connect to server" };
    //             return updatedMessages;
    //         });
    //     }
    // };





    const handleSendMessage = async (e) => {
        e.preventDefault();
    
        const userMessageText = question.trim();
    
        
        if (!userMessageText) {
            setMessages((prevMessages) => [...prevMessages, { sender: "error", text: "กรุณากรอกคำถาม!" }]);
            return;
        }
    
        let currentChatId = activeChatId;
    
        
        if (!currentChatId) {
            currentChatId = await createNewChat();
            setActiveChatId(currentChatId);
        }
    
        
        const userMessage = { sender: "user", text: userMessageText };
        addMessageToChat(currentChatId, userMessage.text, "user");
        setMessages((prevMessages) => [...prevMessages, userMessage]);
        setQuestion(''); 
    
        
        const botLoadingMessage = { sender: "bot", text: "กำลังประมวลผล...", isLoading: true };
        setMessages((prevMessages) => [...prevMessages, botLoadingMessage]);
        setIsBotLoading(true);
    
        try {
            console.log('Sending data:', { question: userMessageText, model: selectedModel });
            // const response = await fetch("http://localhost:3000/ask-ai", {
            const response = await fetch("https://geminiapi-flame.vercel.app/api/index", { 
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question: userMessageText, model: selectedModel }),
            });
    
            const result = await response.json();
            console.log(result);
    
           
            if (response.ok) {
                const botMessageText = formatBotMessage(result.answer || "No answer received");
                const botMessage = { sender: "bot", text: botMessageText, isLoading: false };
    
               
                setMessages((prevMessages) => {
                    const updatedMessages = [...prevMessages];
                    updatedMessages[updatedMessages.length - 1] = botMessage; 
                    return updatedMessages;
                });
    
                addMessageToChat(currentChatId, botMessage.text, "bot");
                console.log("Send Messages Pass");
    
            } else {
                
                const errorMessage = result.error || "Error occurred";
                setIsBotLoading(false);
    
                setMessages((prevMessages) => {
                    const updatedMessages = [...prevMessages];
                    updatedMessages[updatedMessages.length - 1] = { sender: "error", text: errorMessage };
                    return updatedMessages;
                });
            }
    
        } catch (error) {
          
            console.error("Error:", error);
            setIsBotLoading(false);
    
            setMessages((prevMessages) => {
                const updatedMessages = [...prevMessages];
                updatedMessages[updatedMessages.length - 1] = { sender: "error", text: "Please Try Again" };
                return updatedMessages;
            });
        } finally {
            setIsBotLoading(false); 
        }
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

                setActiveChatId(null);
                setMessages([]);


                setIsLoading(false);
            } catch (error) {
                console.error("Error deleting chat: ", error);
            }
        }
    };


    // Handle input change
    const handleInputChange = (event) => {
        setQuestion(event.target.value);
    };

    return (
        <div>
            <div className={`app-container ${theme}`}>
                <div className={`all-container ${isOpen ? "drawer-open" : ""}`}>
                    <Header
                        toggleDrawer={toggleDrawer}
                        isOpen={isOpen}
                        animateHeaderLine={animateHeaderLine}
                        setSelectedModel={setSelectedModel}
                        setAnimateHeaderLine={setAnimateHeaderLine}
                        selectedModel={selectedModel}
                    />
                    {/* <ThemeSwitcher theme={theme} toggleTheme={toggleTheme} /> */}
                    <ChatContainer
                        isOpen={isOpen}
                        messages={messages}
                        handleSendMessage={handleSendMessage}
                        question={question}
                        handleInputChange={handleInputChange}
                        isLoading={isLoading}
                        showGreeting={showGreeting}
                        setQuestion={setQuestion}
                        setSelectedFile={setSelectedFile}
                        setImageFile={setImageFile}
                        setImagePreview={setImagePreview}
                        deleteChat={deleteChat}
                        isBotLoading={isBotLoading}



                    />
                </div>
                <Drawer
                    isOpen={isOpen}
                    toggleDrawer={toggleDrawer}
                    newChatTitle={newChatTitle}
                    setNewChatTitle={setNewChatTitle}
                    chatItems={chatItems}
                    setChatItems={setChatItems}
                    // deleteChat={deleteChat}
                    handleChatClick={handleChatClick}
                    handleOptionChat={handleOptionChat}
                    openMenuChatId={openMenuChatId}
                    setOpenMenuChatId={setOpenMenuChatId}
                    deleteChat={deleteChat}
                    editingChatId={editingChatId}
                    editedChatTitle={editedChatTitle}
                    setEditedChatTitle={setEditedChatTitle}
                    setEditingChatId={setEditingChatId}
                    confirmDeleteChat={confirmDeleteChat}
                    isDeleteModalOpen={isDeleteModalOpen}
                    setIsDeleteModalOpen={setIsDeleteModalOpen}
                    setIsOpen={setIsOpen}


                />
                <BackDrop isOpen={isOpen} toggleDrawer={toggleDrawer} />
                
            </div>


        </div>
    );
};


export default AppContainer;
