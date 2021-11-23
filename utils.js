const CONTRACT_ADDRESS = '0x4342135Dc8E238B7e3ae20f931dbB2208e827192';

const transformCharacterData = (characterData) => {
  return {
    name: characterData.name,
    imageUri: characterData.imageUri,
    hp: characterData.hp.toNumber(),
    maxHp: characterData.maxHp.toNumber(),
    attackDamage: characterData.attackDamage.toNumber(),
    tokenId: characterData.tokenId.toNumber()
  };
};

const transformBossData = (characterData) => {
    return {
      name: characterData.name,
      imageUri: characterData.imageUri,
      hp: characterData.hp.toNumber(),
      maxHp: characterData.maxHp.toNumber(),
      attackDamage: characterData.attackDamage.toNumber()
    };
  };

export { CONTRACT_ADDRESS, transformCharacterData, transformBossData };