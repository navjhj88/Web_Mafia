const patternMail = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;
const idPattern = {
    minlength: 8,
    maxlength: 20,
    pattern : `^([a-zA-Z0-9_])+`
};
const passPattern = {
    minlength: 6,
    maxlength: 50,
    pattern : `^([a-zA-Z0-9_])+`
};

const isPattern = (id, pass, mail = '') => {
    const check = (str, pattern) => {
        let result = null;
        if(pattern instanceof RegExp)
            result = str.match(pattern);
        else 
            result = str.match(new RegExp(pattern.pattern));

        if(result === null) return true;
        else {
            result = result[0];
            if(result.length === str.length) {
                if(pattern instanceof RegExp)
                    return false;
                else {
                    if(str.length >= pattern.minlength && str.length <= pattern.maxlength)
                        return false;
                    else
                        return true;
                }
            }
            else return true;
        }
    };

    if(mail === '') 
        return [check(id, idPattern), check(pass, passPattern)];
    else 
        return [check(id, idPattern), check(pass, passPattern), check(mail, patternMail)];
};

if(typeof module !== 'undefined'){
    module.exports = { isPattern };
}