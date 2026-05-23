"""
Women Entrepreneurs Platform — Backend
Flask application with REST APIs, AI logic, and HTML template serving.
Uses simple in-memory data stores for beginner-friendly local setup.
"""

from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from datetime import timedelta

app = Flask(__name__, template_folder='templates', static_folder='static')
CORS(app)

# --- Configuration ---
app.config['JWT_SECRET_KEY'] = 'super-secret-key'  # Change in production
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
jwt = JWTManager(app)

# ======================================================
# In-Memory Data Store (replaces MongoDB for simplicity)
# ======================================================

# Users store: { email: { email, password, name, interests, business_name, business_description, business_image_url, is_entrepreneur, wallet } }
users_store = {
    "jane@example.com": {
        "email": "jane@example.com",
        "password": "password123",
        "name": "Jane Smith",
        "interests": ["Retail", "Fashion"],
        "business_name": "Jane's Handcrafted Jewelry",
        "business_description": "We create unique, sustainable jewelry using recycled materials.",
        "business_image_url": "https://picsum.photos/400/200?random=1",
        "is_entrepreneur": True,
        "wallet": []
    },
    "maria@example.com": {
        "email": "maria@example.com",
        "password": "password123",
        "name": "Maria Garcia",
        "interests": ["AgriTech"],
        "business_name": "Organic Roots Farm",
        "business_description": "Delivering fresh, organic produce straight from our farm to your door.",
        "business_image_url": "https://picsum.photos/400/200?random=2",
        "is_entrepreneur": True,
        "wallet": []
    }
}

# Pre-populated mock data
products_data = [
    {"id": 1, "name": "Eco-friendly Tote Bag", "price": 15.99, "category": "Eco", "description": "Handmade organic cotton bag perfect for everyday use."},
    {"id": 2, "name": "Handmade Clay Earrings", "price": 12.50, "category": "Jewelry", "description": "Stylish, lightweight earrings crafted by artisans."},
    {"id": 3, "name": "Organic Skincare Kit", "price": 45.00, "category": "Beauty", "description": "Chemical-free skin care essentials for radiant skin."},
    {"id": 4, "name": "Artisan Scented Candles", "price": 22.00, "category": "Home", "description": "Hand-poured soy candles with natural fragrances."},
    {"id": 5, "name": "Recycled Fabric Notebook", "price": 8.99, "category": "Stationery", "description": "Eco-conscious notebook made from recycled materials."},
    {"id": 6, "name": "Herbal Tea Collection", "price": 18.75, "category": "Food", "description": "Curated set of organic herbal teas for wellness."},
]

mentors_data = [
    {"id": 1, "name": "Sarah Chen", "expertise": "Tech Startups", "bio": "Serial entrepreneur with 3 successful exits. Angel investor focused on women-led tech companies."},
    {"id": 2, "name": "Dr. Maya Patil", "expertise": "Sustainable Fashion", "bio": "PhD in material science turned fashion designer. Advocate for ethical and sustainable fashion."},
    {"id": 3, "name": "Elena Rodriguez", "expertise": "Digital Marketing", "bio": "Expert in scaling e-commerce brands from ₹0 to ₹10L+ using organic social strategies."},
    {"id": 4, "name": "Amira Hassan", "expertise": "Finance & Funding", "bio": "Former investment banker turned startup advisor. Specialises in fundraising for early-stage ventures."},
    {"id": 5, "name": "Priya Sharma", "expertise": "EdTech & AI", "bio": "AI researcher and educator building tools to democratise learning for underserved communities."},
]

business_ideas_data = [
    {"id": 1, "title": "Zero-Waste Grocery Store", "industry": "Retail", "description": "Minimise plastic usage in daily shopping with refill stations and package-free products."},
    {"id": 2, "title": "AI-Powered Tutoring Platform", "industry": "EdTech", "description": "Personalised learning paths for school students using adaptive AI algorithms."},
    {"id": 3, "title": "Vertical Farming at Home", "industry": "AgriTech", "description": "Compact hydroponic systems for apartments enabling year-round fresh produce."},
    {"id": 4, "title": "Sustainable Fashion Marketplace", "industry": "Fashion", "description": "An online hub connecting eco-conscious designers with mindful consumers."},
    {"id": 5, "title": "Wellness Subscription Box", "industry": "HealthTech", "description": "Curated monthly boxes with organic health and wellness products."},
    {"id": 6, "title": "Women's Co-working Space", "industry": "Retail", "description": "Community-driven workspaces designed specifically for women entrepreneurs."},
]

product_chat_history = {}


# =====================
# Auth APIs
# =====================

@app.route('/api/signup', methods=['POST'])
def signup():
    """Register a new user and return a JWT token."""
    data = request.json
    email = data.get('email')
    password = data.get('password')
    name = data.get('name')

    if email in users_store:
        return jsonify({"msg": "User already exists"}), 400

    users_store[email] = {
        "email": email,
        "password": password,  # In production, hash this!
        "name": name,
        "interests": data.get('interests', []),
        "business_name": "",
        "business_description": "",
        "business_image_url": "",
        "is_entrepreneur": False,
        "wallet": []
    }

    access_token = create_access_token(identity=email)
    return jsonify(access_token=access_token), 201


@app.route('/api/login', methods=['POST'])
def login():
    """Authenticate a user and return a JWT token."""
    data = request.json
    email = data.get('email')
    password = data.get('password')

    user = users_store.get(email)
    if not user or user['password'] != password:
        return jsonify({"msg": "Bad email or password"}), 401

    access_token = create_access_token(identity=email)
    return jsonify(access_token=access_token), 200


# =====================
# User Profile API
# =====================

@app.route('/api/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Return the current user's profile (auth required)."""
    current_user_email = get_jwt_identity()
    user = users_store.get(current_user_email)
    if not user:
        return jsonify({"msg": "User not found"}), 404
    # Return profile without the password
    return jsonify({k: v for k, v in user.items() if k != 'password'}), 200


# =====================
# Mentors API
# =====================

@app.route('/api/mentors', methods=['GET'])
def get_mentors():
    """Return all available mentors."""
    return jsonify(mentors_data), 200


@app.route('/api/connect_mentor', methods=['POST'])
def connect_mentor():
    """Log a connection request from a user or visitor."""
    data = request.json
    mentor = data.get('mentor')
    message = data.get('message')
    email = data.get('email')  # Provided by visitors
    
    # Try to get user identity if token exists (optional JWT)
    # Since we use @jwt_required(optional=True) or just check headers manually
    # Flask-JWT-Extended doesn't have an easy "optional" decorator without config
    # We'll just trust the frontend for now or check header manually
    
    auth_header = request.headers.get('Authorization')
    user_email = "Visitor"
    if auth_header and "Bearer " in auth_header:
        # In a real app, we'd verify the token here
        user_email = "Authenticated User" # Simplified for this demo
    
    sender = email if email else user_email
    
    print(f"\n[MENTOR CONNECTION REQUEST]")
    print(f"To: {mentor}")
    print(f"From: {sender}")
    print(f"Message: {message}\n")
    
    return jsonify({"msg": "Connection request sent!"}), 200


# =====================
# Business Profiles API
# =====================

@app.route('/api/entrepreneurs', methods=['GET'])
def get_entrepreneurs():
    """Return all users who are entrepreneurs."""
    entrepreneurs = [
        {k: v for k, v in user.items() if k != 'password' and k != 'wallet'}
        for user in users_store.values() if user.get('is_entrepreneur')
    ]
    return jsonify(entrepreneurs), 200


@app.route('/api/profile/update', methods=['POST'])
@jwt_required()
def update_profile():
    """Update user profile/business info."""
    current_user_email = get_jwt_identity()
    user = users_store.get(current_user_email)
    if not user:
        return jsonify({"msg": "User not found"}), 404

    data = request.json
    user['business_name'] = data.get('business_name', user['business_name'])
    user['business_description'] = data.get('business_description', user['business_description'])
    user['business_image_url'] = data.get('business_image_url', user['business_image_url'])
    user['is_entrepreneur'] = data.get('is_entrepreneur', user['is_entrepreneur'])
    
    return jsonify({"msg": "Profile updated successfully"}), 200


# =====================
# Wallet API
# =====================

@app.route('/api/wallet', methods=['GET'])
@jwt_required()
def get_wallet():
    """Return the user's wallet (saved items)."""
    current_user_email = get_jwt_identity()
    user = users_store.get(current_user_email)
    if not user:
        return jsonify({"msg": "User not found"}), 404
    
    return jsonify(user.get('wallet', [])), 200


@app.route('/api/wallet/add', methods=['POST'])
@jwt_required()
def add_to_wallet():
    """Add an item/profile to the user's wallet."""
    current_user_email = get_jwt_identity()
    user = users_store.get(current_user_email)
    if not user:
        return jsonify({"msg": "User not found"}), 404

    item = request.json.get('item')
    if not item:
        return jsonify({"msg": "No item provided"}), 400

    # Avoid duplicates
    wallet = user.setdefault('wallet', [])
    if any(i.get('id') == item.get('id') and i.get('type') == item.get('type') for i in wallet):
        return jsonify({"msg": "Item already in wallet"}), 400

    wallet.append(item)
    return jsonify({"msg": "Item added to wallet", "wallet": wallet}), 200


@app.route('/api/wallet/remove', methods=['POST'])
@jwt_required()
def remove_from_wallet():
    """Remove an item from the user's wallet."""
    current_user_email = get_jwt_identity()
    user = users_store.get(current_user_email)
    if not user:
        return jsonify({"msg": "User not found"}), 404

    item_id = request.json.get('id')
    item_type = request.json.get('type')
    
    wallet = user.get('wallet', [])
    user['wallet'] = [i for i in wallet if not (i.get('id') == item_id and i.get('type') == item_type)]
    
    return jsonify({"msg": "Item removed from wallet", "wallet": user['wallet']}), 200


# =====================
# Marketplace API
# =====================

@app.route('/api/products', methods=['GET'])
def get_products():
    """Return all marketplace products."""
    return jsonify(products_data), 200


@app.route('/api/product_chat/<int:product_id>', methods=['GET'])
def get_product_chat(product_id):
    """Fetch the stored chat history for a given product."""
    history = product_chat_history.get(product_id, [])
    return jsonify(history), 200


@app.route('/api/product_chat', methods=['POST'])
def post_product_chat():
    """Send a product chat message and return the updated thread."""
    data = request.json or {}
    product_id = data.get('productId')
    message = (data.get('message') or '').strip()
    sender = data.get('sender', 'buyer')

    if not product_id or not message:
        return jsonify({"msg": "Product ID and message are required."}), 400

    try:
        product_id = int(product_id)
    except (ValueError, TypeError):
        return jsonify({"msg": "Invalid product ID."}), 400

    product = next((item for item in products_data if item['id'] == product_id), None)
    if not product:
        return jsonify({"msg": "Product not found."}), 404

    thread = product_chat_history.setdefault(product_id, [])
    timestamp = datetime.utcnow().isoformat() + 'Z'
    thread.append({
        "sender": sender,
        "message": message,
        "timestamp": timestamp,
    })

    if sender == 'buyer':
        seller_reply = f"Thanks for asking about {product['name']}! This item is crafted with care and ready to ship. If you'd like, I can reserve one for you and answer any questions about customization, delivery, or pricing."
        thread.append({
            "sender": "seller",
            "message": seller_reply,
            "timestamp": datetime.utcnow().isoformat() + 'Z',
        })

    return jsonify({"history": thread}), 200


# =====================
# AI Features
# =====================

@app.route('/api/recommendations', methods=['GET'])
@jwt_required()
def get_recommendations():
    """Suggest business ideas based on user interests (simple AI)."""
    current_user_email = get_jwt_identity()
    user = users_store.get(current_user_email)
    if not user:
        return jsonify([]), 200

    interests = user.get('interests', [])

    # Simple recommendation: match interests to industry keywords
    if interests:
        recs = [
            idea for idea in business_ideas_data
            if any(str(interest).lower() in idea['industry'].lower() for interest in interests)
        ]
    else:
        recs = business_ideas_data  # Show all if no interests set

    return jsonify(recs), 200


@app.route('/api/predict_success', methods=['POST'])
def predict_success():
    """Predict the success level of a business idea (basic heuristic)."""
    data = request.json
    idea_title = data.get('title', 'Your Idea')
    investment = float(data.get('investment', 0))
    market_size = data.get('market_size', 'Medium')  # Small, Medium, Large

    # Scoring heuristic
    score = 0
    if market_size == 'Large':
        score += 40
    elif market_size == 'Medium':
        score += 25
    else:
        score += 10

    if investment < 5000:
        score += 30
    elif investment < 20000:
        score += 20
    else:
        score += 10

    success_level = "High" if score >= 55 else "Moderate" if score >= 30 else "Low"
    message = f"Based on our analysis, the success potential for '{idea_title}' is {success_level}."

    return jsonify({
        "success_level": success_level,
        "score": score,
        "message": message
    }), 200


@app.route('/api/chatbot', methods=['POST'])
def chatbot():
    """Answer business questions using predefined responses (simple AI chatbot)."""
    question = request.json.get('question', '').lower()

    # Expanded knowledge base
    responses = {
        "how to start": "To start a business: 1) Research your market, 2) Write a business plan, 3) Register your company, 4) Secure funding, and 5) Build your MVP!",
        "business plan": "A business plan should include: Executive Summary, Market Analysis, Organisation Structure, Product Details, Marketing Strategy, and Financial Projections.",
        "funding": "Funding options include: bootstrapping, angel investors, venture capital, crowdfunding platforms, and government grants for women entrepreneurs.",
        "marketing": "Top marketing strategies: social media marketing, content marketing, email campaigns, SEO, and influencer partnerships.",
        "mentor": "Visit our Mentorship page to connect with experienced entrepreneurs who can guide you!",
        "marketplace": "Check out our Marketplace to discover and sell products from women-led businesses.",
        "hello": "Hi there! 👋 I'm your Entrepreneur Assistant. Ask me about starting a business, funding, marketing, or mentorship!",
        "help": "I can help with: starting a business, writing a plan, finding funding, marketing tips, and connecting with mentors. Just ask!",
        "bye": "Goodbye! Good luck with your business! 🚀",
        "thank": "You're welcome! Happy to help. Feel free to ask anything else! 😊",
    }

    answer = "I'm sorry, I don't have information on that yet. Try asking about 'starting a business', 'funding', 'marketing', or 'mentors'."
    for key in responses:
        if key in question:
            answer = responses[key]
            break

    return jsonify({"answer": answer}), 200


# =====================
# Template Routes
# =====================

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/login')
def login_page():
    return render_template('login.html')

@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

@app.route('/mentorship')
def mentorship():
    return render_template('mentorship.html')

@app.route('/marketplace')
def marketplace():
    return render_template('marketplace.html')


if __name__ == '__main__':
    print("\n=== Women Entrepreneurs Platform is running! ===")
    print("    Open http://localhost:5000 in your browser.\n")
    app.run(debug=True, host='0.0.0.0', port=5000)
