import React, { useState, useEffect, useCallback } from 'react';
import Web3 from 'web3';
import { contractAddress } from './config';
import SocialNetworkABI from './artifacts/contracts/SocialNetwork.sol/SocialNetwork.json';

function App() {
    const [account, setAccount] = useState('');
    const [loading, setLoading] = useState(true);
    const [contract, setContract] = useState(null);
    const [posts, setPosts] = useState([]);
    const [newPost, setNewPost] = useState('');
    const [isPosting, setIsPosting] = useState(false);

    const loadBlockchainData = useCallback(async () => {
        if (window.ethereum) {
            const web3 = new Web3(window.ethereum);
            try {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                setAccount(accounts[0]);
                console.log("Connected account:", accounts[0]);

                const socialNetworkContract = new web3.eth.Contract(
                    SocialNetworkABI.abi,
                    contractAddress
                );
                setContract(socialNetworkContract);
                console.log("Contract connected:", socialNetworkContract);

                await loadPosts(socialNetworkContract);
            } catch (error) {
                console.error("Error loading blockchain data:", error);
            }
        } else {
            console.error("No Ethereum provider found. Install MetaMask.");
        }
        setLoading(false);
    }, []);

    const loadPosts = async (contract) => {
        console.log("Loading posts...");
        const postCount = await contract.methods.postCount().call();
        console.log("Post count:", postCount);

        const loadedPosts = [];
        for (let i = 1; i <= postCount; i++) {
            const post = await contract.methods.posts(i).call();
            loadedPosts.push({
                author: post.author,
                content: post.content,
                timestamp: post.timestamp
            });
        }
        setPosts(loadedPosts);
        console.log("Loaded posts:", loadedPosts);
    };

    const createPost = async () => {
        const trimmedPost = newPost.trim();
        console.log("New post content after trim:", trimmedPost); // Check content after trim
        if (contract && trimmedPost) {
            setIsPosting(true);
            try {
                if (!window.ethereum) {
                    alert("Please install MetaMask!");
                    setIsPosting(false);
                    return;
                }

                await window.ethereum.request({ method: 'eth_requestAccounts' });
                const web3 = new Web3(window.ethereum);
                const nonce = await web3.eth.getTransactionCount(account);

                const response = await contract.methods.createPost(trimmedPost).send({
                    from: account,
                    nonce: nonce,
                    gas: 3000000 
                });

                console.log("Transaction response:", response);

                const newPostData = { author: account, content: trimmedPost, timestamp: Math.floor(Date.now() / 1000) };
                setPosts([newPostData, ...posts]); // Optimistically add new post
                setNewPost(''); // Clear input field
            } catch (error) {
                console.error("Error creating post:", error);
                if (error.message.includes('User denied transaction signature')) {
                    alert("Transaction was denied. Please try again.");
                } else {
                    alert("Failed to create post. Check console for details.");
                }
            } finally {
                setIsPosting(false);
            }
        } else {
            console.log("Alert triggered: New post content is empty or invalid.");
            alert("Please enter a post before submitting.");
        }
    };

    useEffect(() => {
        loadBlockchainData();

        const handleChainChanged = (chainId) => {
            window.location.reload();
        };

        const handleAccountsChanged = (accounts) => {
            if (accounts.length > 0) {
                setAccount(accounts[0]);
            } else {
                console.log("Please connect to MetaMask.");
            }
        };

        if (window.ethereum) {
            window.ethereum.on('chainChanged', handleChainChanged);
            window.ethereum.on('accountsChanged', handleAccountsChanged);
        }

        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener('chainChanged', handleChainChanged);
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
            }
        };
    }, [loadBlockchainData]);

    if (loading) return <div>Loading Blockchain Data...</div>;

    return (
        <div style={{ maxWidth: '600px', margin: 'auto', fontFamily: 'Arial, sans-serif' }}>
            <h1>Decentralized Social Network</h1>
            <p><strong>Account:</strong> {account}</p>
            <div style={{ marginBottom: '20px' }}>
                <h2>Create Post</h2>
                <input
                    type="text"
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    placeholder="What's on your mind?"
                    style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
                />
                <button onClick={createPost} disabled={isPosting} style={{ padding: '10px 20px' }}>
                    {isPosting ? 'Posting...' : 'Post'}
                </button>
            </div>
            <div>
                <h2>Posts</h2>
                {posts.length === 0 ? (
                    <p>No posts yet!</p>
                ) : (
                    <ul style={{ listStyleType: 'none', padding: 0 }}>
                        {posts.map((post, index) => (
                            <li key={index} style={{ border: '1px solid #ddd', padding: '10px', marginBottom: '10px' }}>
                                <p><strong>Author:</strong> {post.author}</p>
                                <p><strong>Content:</strong> {post.content}</p>
                                <p><small><strong>Timestamp:</strong> {new Date(post.timestamp * 1000).toLocaleString()}</small></p>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

export default App;