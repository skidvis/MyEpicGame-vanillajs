import { ethers } from "./ethers-5.2.esm.min.js";
// rename the json file to .js and add 'export default' to the top line
import myEpicGame from './MyEpicGame.js';
// alternatively, 'import assertion' works in chrome, but it's not ready on firefox yet.

import {CONTRACT_ADDRESS, transformCharacterData} from "./utils.js";

var gameContract = null;
var characters = null;
var currentAccount = null;
var characterNFT = null;
var boss = null;

var resetButton = document.getElementById('reset-button');
var attackButton = document.getElementById('attack-button');

const isLoaded = () => {
    console.log('This is a vanillajs (plain old javascript) implementation of the nft-game-starter project.');
    document.getElementById('login-button').addEventListener('click', ()=>{connectWallet()});
    attackButton.addEventListener('click', ()=>{
        if(boss.hp > 0) runAttackAction();
    });    
    resetButton.addEventListener('click', ()=>{ResetHealth()});
}

const showSection = (name, shouldShow = true) => {
    console.log('showing: %s', name);
    var sections = document.getElementsByClassName('section');
    for (var i = 0; i < sections.length; i++) {
        sections[i].classList.add('d-none');
    }

    var el = document.getElementById(name);
    shouldShow ? el.classList.remove('d-none') : el.classList.add('d-none');
}

const NftMinted = (address, tokenId, characterId)=> {
    hideSwal();
    document.location = ""
}

const checkforWallet = async () => {
    try{
        const { ethereum } = window;

        if(!ethereum){
            console.log('Make sure you have metamask!');
            return;
        }else{
            console.log('We have the ethereum object!');

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

    // listen to emit events
    gameContract.on('NftMinted', NftMinted);
    gameContract.on('AttackComplete', AttackComplete);
    gameContract.on('ResetHealth', onResetHealth);

    const txn = await gameContract.getUserNFT();
    console.log(txn);

    if(txn.name){
        console.log('User has an NFT');
        characterNFT = transformCharacterData(txn);
        updatePlayerUi();
    }else{
        console.log('No NFT found');
    }
};  

const updatePlayerUi = () => {
    var el = document.getElementById('player-nft');
    el.querySelector('.player-name').innerText = characterNFT.name;
    el.querySelector('.player-image').src = characterNFT.imageUri;        
    el.querySelector('.player-hp').innerText = `Health: ${characterNFT.hp}/${characterNFT.maxHp}`;
}

const showLogin = () => {    
    showSection('login-section');
}

const connectWallet = async () => {
    try{
      if(currentAccount != null) return;
      
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
      runLogic();
    }catch(error){
      console.log(error);
    }
}

const showNFT = () => {
    showSection('arena-section');
}

const showMinter = () => {
    showSection('mint-section');
}

const mintCharacterNFTAction = async (characterId) =>  {
    try {
      if (gameContract) {
        showSwal('Minting that badboy...');
        console.log(`Minting character ${characterId} in progress...`);
        const mintTxn = await gameContract.mintCharacterNFT(characterId);
        await mintTxn.wait();
        console.log('mintTxn:', mintTxn);
      }
    } catch (error) {
      console.warn('MintCharacterAction Error:', error);
      hideSwal();
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

      if(characters != null){
          var section = document.getElementById('mint-section');
          var template = document.getElementById('mint-template');
          characters.forEach((char, index) => {
            var el = template.cloneNode(true);
            el.querySelector('.character-name').innerText = char.name;
            el.querySelector('.character-image').src = char.imageUri;
            el.querySelector('.character-mint').addEventListener('click', ()=> {mintCharacterNFTAction(index)});
            el.querySelector('.character-mint').innerText = `Mint ${char.name}`;
            el.style.display = 'inline-block';
            section.appendChild(el);
          })
      }

    } catch (error) {
      console.error('Something went wrong fetching characters:', error);
    }
};

const fetchBoss = async () => {
    const bossTxn = await gameContract.getBigBoss();
    console.log('Boss:', bossTxn);
    boss = transformCharacterData(bossTxn);
    updateBossUi();
};

const updateBossUi = () => {
    var el = document.getElementById('boss-nft');
    el.querySelector('.boss-name').innerText = boss.name;
    el.querySelector('.boss-image').src = boss.imageUri;
    el.querySelector('.boss-hp').innerText = `Health: ${boss.hp}/${boss.maxHp}`;    
    showButtons();
}

const runAttackAction = async () => {
    try {
      if (gameContract) {
        showSwal('Attacking that sumbich!');  
        console.log('Attacking boss...');
        const attackTxn = await gameContract.attackBoss();
        await attackTxn.wait();
        console.log('attackTxn:', attackTxn);          
      }
    } catch (error) {
      console.error('Error attacking boss:', error);
      hideSwal();
    }    
};

const AttackComplete = (newBossHp, newPlayerHp) => {
    hideSwal();
    const bossHp = newBossHp.toNumber();
    const playerHp = newPlayerHp.toNumber();

    Swal.fire(
        'Good job!',
        `AttackComplete: Boss Hp: ${bossHp} Player Hp: ${playerHp}`,
        'success'
      )
    console.log(`AttackComplete: Boss Hp: ${bossHp} Player Hp: ${playerHp}`);

    /*
    * Update both player and boss Hp
    */
    boss.hp = bossHp;
    characterNFT.hp = playerHp;
    
    updateBossUi();
    updatePlayerUi();
};

const showButtons = () => {
    console.log(boss);
    if(boss.hp == 0){
        attackButton.classList.add('d-none');
        resetButton.classList.remove('d-none');
        document.getElementById('win-h1').classList.remove('d-none');
    }else{
        attackButton.classList.remove('d-none');
        resetButton.classList.add('d-none');
        document.getElementById('win-h1').classList.add('d-none');        
    };
}

const ResetHealth = async () => {
    try{
        const txn = await gameContract.resetHealth();
        console.log('Resetting Health:', txn);
        showSwal('Resetting Health...');
    }catch (error){
        hideSwal();
        console.log(error);
    }
};

const onResetHealth = (newBossHp, newPlayerHp) => {
    hideSwal();
    const bossHp = newBossHp.toNumber();
    const playerHp = newPlayerHp.toNumber();
    console.log(`Healths reset.. ${newBossHp} and ${newPlayerHp}`);
    location.reload();
};

const runLogic = () => {
    checkforWallet().then(()=>{
        showSwal('loading..');

        //if not authenticated, show login button
        if(currentAccount == null) showLogin();
        
        //if authenticated, check for existing NFT and..
        if(currentAccount != null) fetchNFTMeta().then(()=> { 
            //exit if error with contract
            if(gameContract == null) return;

            //get all the NFT characters
            if(gameContract != null){ 
                if(characters == null) getCharacters();
                if(boss == null) fetchBoss(); 
            }; 

            //If no character minted, show mint screen
            if(characterNFT == null){ showMinter() };

            //If character exists, show image
            if(characterNFT != null){ showNFT() }; 
        });

        hideSwal();
    });     
}

const showSwal = (msg) => {
    Swal.fire({
        title: msg,
        imageUrl: 'loading.gif',
                imageWidth: 384,
                imageHeight: 215,
        showConfirmButton: false,
        allowOutsideClick: false,
        allowEscapeKey: false
      })    
}

const hideSwal = () => {
    Swal.close();
}

//do this when the page loads
document.addEventListener("DOMContentLoaded", function() {
    //say hello
    isLoaded();

    //check for metamask
    runLogic();
});