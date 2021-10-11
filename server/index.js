const express = require('express');
const SHA256 = require('crypto-js/sha256');
const EC = require('elliptic').ec;
const app = express();
const cors = require('cors');
const port = 3042;
const ec = new EC('secp256k1');

// localhost can have cross origin errors
// depending on the browser you use!
app.use(cors());
app.use(express.json());

const balances = {
  "1": 100,
  "2": 50,
  "3": 75,
}

const privateKeyMap = {};
const publicBalances = {};

function createPrivateKeys(accounts) {
  const accountsKeyList = Object.keys(accounts);
  accountsKeyList.forEach(account => {
    const privateKey = ec.genKeyPair();
    const publicKey = privateKey.getPublic().encode('hex');
    const accountBal = balances[account];
    privateKeyMap[publicKey] = privateKey;
    publicBalances[publicKey] = accountBal;
  });
}

function showPubBalanceAndKey(pubAccounts) {
  let accountsList = "";
  let privateKeyList = "";
  const accountsKeyList = Object.keys(pubAccounts);
  accountsKeyList.map((account, idx) => {
    const accountBal = pubAccounts[account];
    const privateKey = privateKeyMap[account];
    accountsList = accountsList + `(${idx}) ${account} (${accountBal} ETH) \n`;
    privateKeyList = privateKeyList + `(${idx}) ${privateKey.getPrivate().toString(16)} \n`;
  })

  console.log(`
  Available Accounts
  ==================\n${accountsList}
  Private Keys
  ==================\n${privateKeyList}
  `)
}

app.get('/balance/:address', (req, res) => {
  const {address} = req.params;
  const balance = publicBalances[address] || 0;
  res.send({ balance });
});

app.post('/send', (req, res) => {
  const {sender, recipient, amount, signature, publicKey, signedPayload} = req.body;
  console.log(req.body);
  console.log(req.body.signature, req.body.signedPayload);
  const key = ec.keyFromPublic(publicKey, 'hex');
  const hashedBody = SHA256(JSON.stringify(signedPayload)).toString();
  console.log(signature, signedPayload);
  const isSignatureVerified = key.verify(hashedBody, signature);

  if (isSignatureVerified) {
    balances[sender] -= amount;
    balances[recipient] = (balances[recipient] || 0) + +amount;
    res.send({ balance: balances[sender] });
  } else {
    res.sendStatus(400);
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
  createPrivateKeys(balances)
  showPubBalanceAndKey(publicBalances);
});
