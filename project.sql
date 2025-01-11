-- Table for Users
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    social_id VARCHAR(255) DEFAULT NULL,
    is_verified BOOLEAN DEFAULT false,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL,
    profile_image VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for Communes
CREATE TABLE communes (
    commune_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    commune_image VARCHAR(255),
    description TEXT,
    content LONGTEXT NOT NULL,
    admin_id INT NOT NULL,
    privacy ENUM('public', 'private') DEFAULT 'public',
    location VARCHAR(255),
    commune_type ENUM('normal', 'ecommerce') DEFAULT 'normal',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Table for Commune Memberships
CREATE TABLE commune_memberships (
    membership_id INT AUTO_INCREMENT PRIMARY KEY,
    commune_id INT NOT NULL,
    user_id INT NOT NULL,
    role ENUM('admin', 'moderator', 'member') DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (commune_id) REFERENCES communes(commune_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Table for Posts
CREATE TABLE posts (
    post_id INT AUTO_INCREMENT PRIMARY KEY,
    commune_id INT DEFAULT NULL,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    post_type ENUM('blog', 'listing') NOT NULL,
    links VARCHAR(512),
    tags VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (commune_id) REFERENCES communes(commune_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Table for Commune Reviews
CREATE TABLE commune_reviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    commune_id INT NOT NULL,
    user_id INT NOT NULL,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (commune_id) REFERENCES communes(commune_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Table for Post Attributes (Dynamic Fields for Listings)
CREATE TABLE post_attributes (
    attribute_id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    attribute_name VARCHAR(255) NOT NULL,
    attribute_value VARCHAR(255) NOT NULL,
    FOREIGN KEY (post_id) REFERENCES posts(post_id) ON DELETE CASCADE
);

-- Table for Reactions (Likes and Dislikes)
CREATE TABLE reactions (
    reaction_id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    user_id INT NOT NULL,
    reaction_type ENUM('like', 'hate') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(post_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE (post_id, user_id)
);

-- Table for Comments
CREATE TABLE comments (
    comment_id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(post_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Table for Events
CREATE TABLE events (
    event_id INT AUTO_INCREMENT PRIMARY KEY,
    commune_id INT NOT NULL,
    event_name VARCHAR(255) NOT NULL,
    event_image VARCHAR(255),
    event_description TEXT,
    event_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (commune_id) REFERENCES communes(commune_id) ON DELETE CASCADE
);

-- Table for Commune Collaborations
CREATE TABLE collaborations (
    collaboration_id INT AUTO_INCREMENT PRIMARY KEY,
    commune_id_1 INT NOT NULL,
    commune_id_2 INT NOT NULL,
    collaboration_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (commune_id_1) REFERENCES communes(commune_id) ON DELETE CASCADE,
    FOREIGN KEY (commune_id_2) REFERENCES communes(commune_id) ON DELETE CASCADE
);

-- Table for Chats
CREATE TABLE chats (
    chat_id INT AUTO_INCREMENT PRIMARY KEY,
    commune_id INT NOT NULL,
    chat_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (commune_id) REFERENCES communes(commune_id) ON DELETE CASCADE
);

-- Table for Individual Chats
CREATE TABLE individual_chats (
    chat_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id_1 INT NOT NULL,
    user_id_2 INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id_1) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id_2) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE (user_id_1, user_id_2)
);

-- Table for Individual Chat Messages
CREATE TABLE individual_chat_messages (
    message_id INT AUTO_INCREMENT PRIMARY KEY,
    individual_chat_id INT NOT NULL,  
    sender_id INT NOT NULL,            
    message_text TEXT NOT NULL,        
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    FOREIGN KEY (individual_chat_id) REFERENCES individual_chats(chat_id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Table for Chat Participants
CREATE TABLE chat_participants (
    chat_id INT NOT NULL,
    user_id INT NOT NULL,
    PRIMARY KEY (chat_id, user_id),
    FOREIGN KEY (chat_id) REFERENCES chats(chat_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Table for Messages
CREATE TABLE messages (
    message_id INT AUTO_INCREMENT PRIMARY KEY,
    chat_id INT NOT NULL,
    sender_id INT NOT NULL,
    message_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chat_id) REFERENCES chats(chat_id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Table for Products (E-commerce)
CREATE TABLE products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    commune_id INT NOT NULL,
    user_id INT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    description TEXT,
    product_image VARCHAR(255),
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (commune_id) REFERENCES communes(commune_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Table for Orders
CREATE TABLE orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Table for Order Items
CREATE TABLE order_items (
    order_item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);
