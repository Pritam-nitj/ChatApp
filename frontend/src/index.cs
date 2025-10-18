/* frontend/src/index.css */
body {
    font-family: Arial, sans-serif;
    background-color: #f4f4f9;
    padding: 20px;
}
.chat-container {
    max-width: 600px;
    margin: 40px auto;
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}
.chat-list {
    max-height: 400px;
    overflow-y: auto;
    border: 1px solid #ddd;
    padding: 10px;
    margin-bottom: 20px;
    border-radius: 4px;
}
.chat-item {
    border-bottom: 1px solid #eee;
    padding: 10px 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.chat-item:last-child {
    border-bottom: none;
}
.delete-btn {
    background-color: #ff4d4f;
    color: white;
    border: none;
    padding: 5px 10px;
    border-radius: 4px;
    cursor: pointer;
}
.delete-btn:hover {
    background-color: #cc0000;
}
form {
    display: flex;
    flex-direction: column;
    gap: 10px;
}
input, button {
    padding: 10px;
    border-radius: 4px;
    border: 1px solid #ccc;
}
button {
    background-color: #007bff;
    color: white;
    cursor: pointer;
    border: none;
}
button:hover {
    background-color: #0056b3;
}