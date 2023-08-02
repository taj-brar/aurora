class Utility {
    static parseIntSafe(value) {
        const token = parseInt(value.split(" "));
        return isNaN(token) ? -1 : token;
    }
}// end class Utility

module.exports = Utility;