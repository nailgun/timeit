describe('nw.utils', function () {
    describe('#capitalize', function () {
        it('should return same string with first character capitalized', function () {
            var c = nw.utils.capitalize;
            expect(c('moscow')).to.be('Moscow');
            expect(c('Moscow')).to.be('Moscow');
            expect(c('123')).to.be('123');
            expect(c('!')).to.be('!');
        });

        it('should work with non-latin characters', function () {
            var c = nw.utils.capitalize;
            expect(c('москва')).to.be('Москва');
        });
    });
});
