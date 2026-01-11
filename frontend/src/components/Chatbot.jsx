import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
// --- MODIFICATION 1: Imported new icons for feedback ---
import { FiX, FiSend, FiCpu, FiThumbsUp, FiThumbsDown } from 'react-icons/fi';

const BASE_URL = "http://localhost:5500";

const dotVariants = {
    initial: { y: "0%" },
    animate: { y: "100%" },
};

const defaultSampleQuestions = [
    "What is the total stock on hand?",
    "Show me products with low inventory.",
    "What is the forecasted demand for next month?",
    "Summarize the inventory status."
];

const Chatbot = ({ mode = 'floating', isOpen: propIsOpen, onClose: propOnClose, questions }) => {
    // --- MODIFICATION 2: Updated initial message state with ID and feedback fields ---
    const [messages, setMessages] = useState([
        { id: 1, sender: 'bot', text: 'Hello! How can I help you with the inventory data today?', feedback: null }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const questionsToShow = questions && questions.length > 0 ? questions : defaultSampleQuestions;
    
    // --- Start of unchanged code ---
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const isFloating = mode === 'floating';
    const isIntegrated = mode === 'integrated';
    const isBar = mode === 'bar';

    const isOpen = isIntegrated ? propIsOpen : (isFloating ? internalIsOpen : true);
    const handleClose = isIntegrated ? propOnClose : () => setInternalIsOpen(false);
    const handleOpen = () => {
        if (isFloating) {
            setInternalIsOpen(true);
        }
    };

    const showMessages = !isBar || messages.length > 1;

    useEffect(() => {
        if (isOpen && showMessages) {
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    }, [messages, isLoading, isOpen, showMessages]);
    // --- End of unchanged code ---

    const submitQuery = useCallback(async (queryText) => {
        if (!queryText.trim() || isLoading) return;
        // --- MODIFICATION 3: Added a unique ID to each new message ---
        const userMessage = { id: Date.now(), sender: 'user', text: queryText };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            const token = localStorage.getItem("token");
            const headers = { Authorization: `Bearer ${token}` };
            const response = await axios.post(`${BASE_URL}/chat`, { query: queryText }, { headers });
            const botMessage = { 
                id: Date.now() + 1, // Ensure unique ID
                sender: 'bot', 
                text: response.data.response || "I'm not sure how to respond to that.",
                feedback: null // Initialize feedback as null
            };
            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error("Chatbot API error:", error);
            const errorMessage = { 
                id: Date.now() + 1, 
                sender: 'bot', 
                text: "Sorry, I'm having trouble connecting. Please try again later.",
                feedback: null
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading]);
    
    // --- MODIFICATION 4: Updated function to handle feedback clicks and send to backend ---
    const handleFeedback = useCallback((messageId, feedbackType) => {

        // We need to find the user query that led to this bot message.
        // We'll also determine the new feedback state.
        let userQuery = "";
        let newFeedback = null;
        let feedbackAction = "none"; // 'submit' or 'none'

        setMessages(prevMessages => {
            // 1. Find the index of the message being rated
            const messageIndex = prevMessages.findIndex(msg => msg.id === messageId);
            if (messageIndex === -1) return prevMessages; // Message not found

            // 2. Find the user query that came before this bot message
            // We loop backwards from the bot message to find the last user message
            for (let i = messageIndex - 1; i >= 0; i--) {
                if (prevMessages[i].sender === 'user') {
                    userQuery = prevMessages[i].text;
                    break; // Found it
                }
            }

            // 3. Determine the new feedback state (handles toggling)
            const currentFeedback = prevMessages[messageIndex].feedback;
            newFeedback = currentFeedback === feedbackType ? null : feedbackType;
            
            // We only want to call the API if the new state is 'up' or 'down'
            if (newFeedback) {
                feedbackAction = 'submit';
            }

            // 4. Perform the API call as a side-effect
            // We do this inside the setMessages update to ensure we have the
            // correct, non-stale data (userQuery and newFeedback).
            if (feedbackAction === 'submit' && userQuery) {
                const sendFeedback = async () => {
                    try {
                        const token = localStorage.getItem("token");
                        const headers = { Authorization: `Bearer ${token}` };
                        
                        await axios.post(`${BASE_URL}/feedback`, {
                            query: userQuery,
                            feedback: newFeedback
                        }, { headers });
                        
                        console.log(`Feedback submitted to backend: Query: [${userQuery}], Feedback: [${newFeedback}]`);

                    } catch (error) {
                        console.error("Failed to send feedback to backend:", error);
                        // Optional: You could add logic here to revert the UI state on failure
                    }
                };
                
                sendFeedback(); // Fire and forget
            
            } else if (feedbackAction === 'submit' && !userQuery) {
                // This might happen if feedback is on the first welcome message
                console.warn(`Feedback given for message ID ${messageId}, but no preceding user query was found.`);
            }

            // 5. Return the new messages array to update the UI
            return prevMessages.map(msg =>
                msg.id === messageId ? { ...msg, feedback: newFeedback } : msg
            );
        });
    }, []); // No dependencies are needed, as setMessages provides prevMessages

    // --- Start of unchanged code ---
    const handleSendMessage = useCallback(() => {
        submitQuery(inputValue);
    }, [inputValue, submitQuery]);

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };
    
    const getContainerClasses = () => {
        if (isBar) return "w-full max-w-2xl mx-auto my-8 bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl shadow-xl flex flex-col overflow-hidden";
        if (isIntegrated) return "w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden";
        return "fixed bottom-6 right-6 z-[1001] w-full max-w-sm h-[70vh] bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden";
    };
    // --- End of unchanged code ---

    return (
        <>
            {/* Floating Prompt Bar (unchanged) */}
            <AnimatePresence>
                {isFloating && !isOpen && (
                    <motion.div
                        onClick={handleOpen}
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 260, damping: 20 } }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="fixed bottom-6 right-6 z-[1001] w-full max-w-xs cursor-pointer"
                        aria-label="Open AI Assistant"
                    >
                        <div className="p-3 bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-lg shadow-2xl shadow-black/30 flex items-center justify-between gap-3">
                            <FiCpu className="text-violet-400 flex-shrink-0" size={20} />
                            <span className="text-slate-300 text-sm font-medium w-full text-left">Ask Akashvani...</span>
                            <div className="p-1.5 bg-gradient-to-br from-violet-600 to-blue-600 rounded-md text-white">
                                <FiSend size={14} />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* The main chat window/bar */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.95 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className={getContainerClasses()}
                        style={isBar ? { maxHeight: '70vh' } : {}}
                    >
                        {/* Header (unchanged) */}
                        {!isBar && (
                            <header className="flex items-center justify-between p-4 bg-slate-900/70 border-b border-slate-700 flex-shrink-0 backdrop-blur-sm">
                                <div className='flex items-center gap-3'>
                                    <FiCpu className="text-violet-400" size={22} />
                                    <h3 className="text-lg font-bold text-white">Akashvani</h3>
                                </div>
                                <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={handleClose} className="p-1 text-slate-400 hover:text-white rounded-full hover:bg-slate-700">
                                    <FiX size={20} />
                                </motion.button>
                            </header>
                        )}
                        
                        {/* Messages Area */}
                        <AnimatePresence>
                            {showMessages && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.4, ease: "easeInOut" }}
                                    className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800"
                                >
                                    {messages.map((msg) => (
                                        // --- MODIFICATION 5: Use `msg.id` as the key for better React performance ---
                                        <motion.div key={msg.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                                            <div className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                {msg.sender === 'bot' && (<div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex-shrink-0 self-start"></div>)}
                                                <div className={`max-w-[85%] p-3 rounded-xl text-sm ${msg.sender === 'user' ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-br-none' : 'bg-slate-700 text-slate-200 rounded-bl-none'}`}>
                                                    <p style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                                                </div>
                                            </div>

                                            {/* --- MODIFICATION 6: Render feedback buttons for bot messages --- */}
                                            {msg.sender === 'bot' && (
                                                <div className="mt-2 flex items-center gap-3 pl-10">
                                                    <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }} onClick={() => handleFeedback(msg.id, 'up')} className="transition-colors">
                                                        <FiThumbsUp size={16} className={msg.feedback === 'up' ? 'text-green-500' : 'text-slate-400 hover:text-slate-200'} />
                                                    </motion.button>
                                                    <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }} onClick={() => handleFeedback(msg.id, 'down')} className="transition-colors">
                                                        <FiThumbsDown size={16} className={msg.feedback === 'down' ? 'text-red-500' : 'text-slate-400 hover:text-slate-200'} />
                                                    </motion.button>
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                    {isLoading && (
                                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-end gap-2 justify-start">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex-shrink-0"></div>
                                            <div className="p-3 rounded-xl rounded-bl-none bg-slate-700 flex items-center justify-center space-x-1.5">
                                                <motion.span variants={dotVariants} transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }} className="w-2 h-2 bg-slate-400 rounded-full" />
                                                <motion.span variants={dotVariants} transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse", delay: 0.2 }} className="w-2 h-2 bg-slate-400 rounded-full" />
                                                <motion.span variants={dotVariants} transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse", delay: 0.4 }} className="w-2 h-2 bg-slate-400 rounded-full" />
                                            </div>
                                        </motion.div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                        
                        {/* Sample Questions (unchanged) */}
                        <AnimatePresence>
                            {messages.length === 1 && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: 0.5 }} className={`flex flex-wrap justify-center gap-2 p-4 ${isBar ? 'pt-4' : 'pt-0'}`}>
                                    {questionsToShow.map((q, i) => (
                                        <motion.button key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 + i * 0.1 }} onClick={() => submitQuery(q)} className="px-3 py-1.5 text-sm bg-slate-700/50 text-slate-300 rounded-full hover:bg-slate-700 transition-colors">
                                            {q}
                                        </motion.button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                        
                        {/* Input Area (unchanged) */}
                        <div className={`p-4 flex-shrink-0 ${isBar && messages.length === 1 ? 'bg-transparent' : 'border-t border-slate-700 bg-slate-900/50'}`}>
                            <div className="relative">
                                <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyPress={handleKeyPress} placeholder="Ask a question..." className="w-full bg-slate-700 border border-slate-600 rounded-lg py-3 pl-4 pr-14 text-white placeholder-slate-400 transition focus:outline-none focus:ring-2 focus:ring-violet-500" disabled={isLoading} />
                                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={handleSendMessage} disabled={isLoading || !inputValue.trim()} aria-label="Send message" className="absolute right-2 top-0 bottom-0 my-auto flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br from-violet-600 to-blue-600 text-white transition-all hover:from-violet-500 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-50">
                                    <FiSend size={16} />
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Chatbot;