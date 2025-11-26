/**
 * Nigerian Banks Utility Function
 * Returns an array of all Nigerian banks with their codes and names
 * @returns {Array} Array of bank objects with code and name properties
 */
function getNigerianBanks() {
  return [
    { code: '044', name: 'Access Bank' },
    { code: '063', name: 'Diamond Bank' },
    { code: '050', name: 'Ecobank Nigeria' },
    { code: '070', name: 'Fidelity Bank' },
    { code: '011', name: 'First Bank of Nigeria' },
    { code: '058', name: 'Guaranty Trust Bank' },
    { code: '030', name: 'Heritage Bank' },
    { code: '301', name: 'Jaiz Bank' },
    { code: '082', name: 'Keystone Bank' },
    { code: '014', name: 'MainStreet Bank' },
    { code: '076', name: 'Polaris Bank' },
    { code: '101', name: 'Providus Bank' },
    { code: '221', name: 'Stanbic IBTC Bank' },
    { code: '068', name: 'Standard Chartered Bank' },
    { code: '232', name: 'Sterling Bank' },
    { code: '100', name: 'Suntrust Bank' },
    { code: '032', name: 'Union Bank of Nigeria' },
    { code: '033', name: 'United Bank for Africa' },
    { code: '215', name: 'Unity Bank' },
    { code: '035', name: 'Wema Bank' },
    { code: '057', name: 'Zenith Bank' }
  ];
}

// Enhanced version with additional utility methods
const nigerianBanksUtils = {
  /**
   * Get all Nigerian banks
   */
  getAllBanks: function() {
    return getNigerianBanks();
  },

  /**
   * Get bank by code
   * @param {string} code - Bank code (e.g., '044', '033')
   * @returns {Object|null} Bank object or null if not found
   */
  getBankByCode: function(code: string) {
    return this.getAllBanks().find(bank => bank.code === code) || null;
  },

  /**
   * Get bank by name (case insensitive)
   * @param {string} name - Bank name or partial name
   * @returns {Object|null} Bank object or null if not found
   */
  getBankByName: function(name: string) {
    const searchTerm = name.toLowerCase();
    return this.getAllBanks().find(bank => 
      bank.name.toLowerCase().includes(searchTerm)
    ) || null;
  },

  /**
   * Search banks by name or code
   * @param {string} searchTerm - Search term
   * @returns {Array} Array of matching banks
   */
  searchBanks: function(searchTerm: string) {
    if (!searchTerm) return this.getAllBanks();
    
    const term = searchTerm.toLowerCase();
    return this.getAllBanks().filter(bank => 
      bank.name.toLowerCase().includes(term) || 
      bank.code.includes(term)
    );
  },

  /**
   * Get bank names only
   * @returns {Array} Array of bank names
   */
  getBankNames: function() {
    return this.getAllBanks().map(bank => bank.name);
  },

  /**
   * Get bank codes only
   * @returns {Array} Array of bank codes
   */
  getBankCodes: function() {
    return this.getAllBanks().map(bank => bank.code);
  },

  /**
   * Check if bank code exists
   * @param {string} code - Bank code to check
   * @returns {boolean} True if bank code exists
   */
  isValidBankCode: function(code: string) {
    return this.getAllBanks().some(bank => bank.code === code);
  },

  /**
   * Get banks sorted by name
   * @returns {Array} Banks sorted alphabetically by name
   */
  getBanksSortedByName: function() {
    return this.getAllBanks().sort((a, b) => a.name.localeCompare(b.name));
  }
};

export default nigerianBanksUtils;
