const CONTRACT_ADDRESS = '0x66d4d12cDf2AC5Cb7e40FBbdF9E5e59d438E71BB';

const transformCharacterData = (characterData) => {
  return {
    name: characterData.name,
    imageUri: characterData.imageUri,
    hp: characterData.hp.toNumber(),
    maxHp: characterData.maxHp.toNumber(),
    attackDamage: characterData.attackDamage.toNumber(),
  };
};

export { CONTRACT_ADDRESS, transformCharacterData };