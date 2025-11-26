interface Transaction {
  amount: string;
  type: 'incoming' | 'outgoing';
  createdAt: Date;
}


export default interface ICryptoWallet {
  _id?: string;
  userId: string;
  address: string;
  privateKey: string;
  usdc: {
    balance: string;
    transactions: Transaction[];
  };
  usdt: {
    balance: string;
    transactions: Transaction[];
  };
  createdAt: Date;
}

