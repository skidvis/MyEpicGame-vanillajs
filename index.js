import { ethers } from "./ethers-5.2.esm.min.js";
import myEpicGame from './MyEpicGame.json' assert { type: "json" };
import {CONTRACT_ADDRESS, transformCharacterData} from "./utils.js";

var app = document.getElementById('app');
var gameContract;
var characters;
var currentAccount;
var characterNFT;

const isLoaded = () => {
    console.log('This is a vanillajs (plain old javascript) implementation of the nft-game-starter project.');
    var btn = document.getElementById('btn-mint');
    btn.addEventListener('click', ()=> {mintCharacterNFTAction(0)});
}

const NftMinted = (address, tokenId, characterId)=> {
    console.log('Minted! %s %s %s', address, tokenId, characterId);
}

const checkforWallet = async () => {
    try{
        const { ethereum } = window;

        if(!ethereum){
            console.log('Make sure you have metamask!');
            return;
        }else{
            console.log('We have the ethereum object!', ethereum);

            const accounts = await ethereum.request({method: 'eth_accounts'});

            if(accounts.length !== 0){
                const account = accounts[0];
                console.log('Found an account: ', account);
                currentAccount = account;
            }else{
                console.log('No accounts found.');
            }
        }      
    } catch (error){
        console.log(error);
    }
};

const fetchNFTMeta = async () => {
    console.log('Checking for NFT at address:', currentAccount);

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    gameContract = new ethers.Contract(CONTRACT_ADDRESS,myEpicGame.abi,signer);
    gameContract.on('NftMinted', NftMinted);

    const txn = await gameContract.getUserNFT();
    console.log(txn);

    if(txn.name){
        console.log('User has an NFT');
        characterNFT = transformCharacterData(txn);
    }else{
        console.log('No NFT found');
    }
};  

const showLogin = () => {    
    var btn = document.createElement('button');
    btn.innerText = 'Login';
    btn.addEventListener('click', ()=>{connectWallet()});
    app.appendChild(btn);
}

const showMint = () => {    
    var btn = document.createElement('button');
    btn.innerText = 'Mint';
    btn.addEventListener('click', ()=>{mintCharacterNFTAction(0)});
    app.appendChild(btn);
}

const connectWallet = async () => {
    try{
      const {ethereum} = window;

      if(!ethereum){
        alert('GetMetamask');
        return;
      }

      const accounts = await ethereum.request({
        method: 'eth_requestAccounts'
      });

      console.log('Connected', accounts[0]);
      currentAccount = accounts[0];
    }catch(error){
      console.log(error);
    }
}

const showImage = () => {
    console.log(characterNFT.imageUri);
    var img = document.createElement('img');
    img.src = characterNFT.imageUri;
    app.appendChild(img);
}

const showMinter = () => {
    console.log('showing minter');
    var img = document.createElement('img');
    img.src = characterNFT.imageUri;
    app.appendChild(img);
}

const mintCharacterNFTAction = async (characterId) =>  {
    console.log('clickkk');
    try {
      if (gameContract) {
        console.log('Minting character in progress...');
        const mintTxn = await gameContract.mintCharacterNFT(characterId);
        await mintTxn.wait();
        console.log('mintTxn:', mintTxn);
      }
    } catch (error) {
      console.warn('MintCharacterAction Error:', error);
    }
};

const getCharacters = async () => {
    try {
      console.log('Getting contract characters to mint');

      const charactersTxn = await gameContract.getAll();
      console.log('charactersTxn:', charactersTxn);

      characters = charactersTxn.map((characterData) =>
        transformCharacterData(characterData)
      );

    } catch (error) {
      console.error('Something went wrong fetching characters:', error);
    }
};

//do this when the page loads
document.addEventListener("DOMContentLoaded", function() {
    //say hello
    isLoaded();

    //check for metamask
    checkforWallet().then(()=>{
        //if not authenticated, show login button
        if(currentAccount == null) showLogin();
        
        //if authenticated, check for existing NFT and..
        if(currentAccount != null) fetchNFTMeta().then(()=> { 
            //exit if error with contract
            if(gameContract == null) return;

            //get all the NFT characters
            if(gameContract != null){ getCharacters() }; 

            //If no character minted, show mint screen
            if(characterNFT == null){ showMinter() };

            //If character exists, show image
            if(characterNFT != null){ showImage() }; 
        });
    });    
});