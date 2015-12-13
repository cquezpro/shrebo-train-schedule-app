module.exports = function(grunt) {
    var variant = grunt.file.read('www/variant');
    return {
        name : 'cleverpendeln-' + variant
    };
}; 