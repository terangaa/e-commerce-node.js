const bcrypt = require('bcrypt');

bcrypt.hash('cheikh123', 10).then(hash => {
    console.log('HASH:', hash);
});