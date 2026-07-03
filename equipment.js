// Equipment definitions for Exercise My Demons

class EquipmentShop {
    constructor() {
        this.items = [
            {
                id: 'demon_spikes',
                name: 'Demon Spikes',
                cost: 10,
                type: 'demon_spikes',
                description: 'Sharp spikes for cardio training'
            },
            {
                id: 'skull_gym',
                name: 'Skull Gym',
                cost: 25,
                type: 'skull_gym',
                description: 'Gym equipment with skull motif'
            },
            {
                id: 'fire_weights',
                name: 'Fire Weights',
                cost: 40,
                type: 'fire_weights',
                description: 'Weight training with fiery theme'
            },
            {
                id: 'soul_anvil',
                name: 'Soul Anvil',
                cost: 75,
                type: 'soul_anvil',
                description: 'Heavy anvils for strength training'
            }
        ];
    }
    
    // Get all available items
    getItems() {
        return this.items;
    }
    
    // Check if player has enough points to purchase an item
    canAfford(item, points) {
        return points >= item.cost;
    }
    
    // Purchase an item (returns true if successful)
    purchaseItem(itemId, points) {
        const item = this.items.find(i => i.id === itemId);
        if (!item) return false;
        
        if (points >= item.cost) {
            return { success: true, item: item };
        }
        
        return { success: false, message: 'Not enough points' };
    }
    
    // Get item by ID
    getItemById(id) {
        return this.items.find(item => item.id === id);
    }
}

// Create global shop instance
const equipmentShop = new EquipmentShop();

// Populate shop items on page load
function populateShopItems() {
    const shopItemsContainer = document.getElementById('shop-items');
    
    if (!shopItemsContainer) return;
    
    const items = equipmentShop.getItems();
    
    shopItemsContainer.innerHTML = '';
    
    items.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'shop-item';
        itemElement.dataset.itemId = item.id;
        
        itemElement.innerHTML = `
            <p class="item-name">${item.name}</p>
            <p class="item-description">${item.description}</p>
            <p class="item-cost">Cost: ${item.cost} points</p>
        `;
        
        // Add click event to purchase
        itemElement.addEventListener('click', () => {
            const points = getPoints();
            const purchaseResult = equipmentShop.purchaseItem(item.id, points);
            
            if (purchaseResult.success) {
                // Check if we can afford it and then spend the points
                if (points >= item.cost) {
                    spendPoints(item.cost);
                    placeEquipmentOnGrid(item);
                }
            } else {
                alert('Not enough points!');
            }
        });
        
        shopItemsContainer.appendChild(itemElement);
    });
}

// Place equipment on grid after purchase
function placeEquipmentOnGrid(equipmentItem) {
    // The actual placement happens in main.js when clicking on tiles
    // This function just prepares the system to know which equipment to place
    console.log(`Equipment ready to be placed: ${equipmentItem.name}`);
}

// Initialize the shop when page loads
window.addEventListener('load', () => {
    populateShopItems();
});