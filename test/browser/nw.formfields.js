describe('nw.forms', function () {
    describe('#StringField', function () {
        it('should convert all values to string', function (done) {
            var form = nw.forms.create({
                field1: nw.forms.StringField(),
                field2: nw.forms.StringField(),
                field3: nw.forms.StringField(),
                field4: nw.forms.StringField({required: false}),
                field5: nw.forms.StringField({required: false})
            });

            form.handle({
                field1: 'value1',
                field2: false,
                field3: 0,
                field4: null
            }, function (bound) {
                expect(bound.isValid()).to.be.ok();
                expect(bound.data.field1).to.be('value1');
                expect(bound.data.field2).to.be('false');
                expect(bound.data.field3).to.be('0');
                expect(bound.data.field4).to.be('');
                expect(bound.data.field5).to.be('');
                done();
            });
        });

        it('should fail if empty and required', function (done) {
            var form = nw.forms.create({
                field1: nw.forms.StringField(),
                field2: nw.forms.StringField(),
                field3: nw.forms.StringField(),
            });

            form.handle({
                field1: null,
                field2: '',
            }, function (bound) {
                expect(bound.isValid()).to.not.be.ok();
                expect(bound.errors).to.have.property('field1');
                expect(bound.errors).to.have.property('field2');
                expect(bound.errors).to.have.property('field3');
                done();
            });
        });
    });

    describe('#NumberField', function () {
        it('should fail on non-numbers', function (done) {
            var form = nw.forms.create({
                field1: nw.forms.NumberField({required: false}),
                field2: nw.forms.NumberField({required: false}),
                field3: nw.forms.NumberField({required: false}),
                field4: nw.forms.NumberField({required: false})
            });

            form.handle({
                field1: 'value',
                field2: '10 value',
                field3: '-+10',
                field4: '10. 10101'
            }, function (bound) {
                expect(bound.isValid()).to.not.be.ok();
                expect(bound.errors).to.have.property('field1');
                expect(bound.errors).to.have.property('field2');
                expect(bound.errors).to.have.property('field3');
                expect(bound.errors).to.have.property('field4');
                done();
            });
        });

        it('should parse empty as null', function (done) {
            var form = nw.forms.create({
                field1: nw.forms.NumberField(),
                field2: nw.forms.NumberField({required: false}),
            });

            form.handle({
                field1: '',
                field2: ''
            }, function (bound) {
                expect(bound.errors).to.have.property('field1');
                expect(bound.data.field2).to.be(null);
                done();
            });
        });

        it('should parse valid numbers', function (done) {
            var form = nw.forms.create({
                field1: nw.forms.NumberField(),
                field2: nw.forms.NumberField(),
                field3: nw.forms.NumberField(),
                field4: nw.forms.NumberField(),
                field5: nw.forms.NumberField()
            });

            form.handle({
                field1: '10',
                field2: '-10',
                field3: '+10',
                field4: '10.10101',
                field5: '0'
            }, function (bound) {
                expect(bound.isValid()).to.be.ok();
                expect(bound.data.field1).to.be(10);
                expect(bound.data.field2).to.be(-10);
                expect(bound.data.field3).to.be(10);
                expect(bound.data.field4).to.be(10.10101);
                expect(bound.data.field5).to.be(0);
                done();
            });
        });
    });

    describe('#BooleanField', function () {
        it('should convert all values to bool', function (done) {
            var form = nw.forms.create({
                field1: nw.forms.BooleanField({required: false}),
                field2: nw.forms.BooleanField({required: false}),
                field3: nw.forms.BooleanField({required: false}),
                field4: nw.forms.BooleanField({required: false}),
                field5: nw.forms.BooleanField({required: false})
            });

            form.handle({
                field1: '',
                field2: 'false',
                field3: 'true',
                field4: null
            }, function (bound) {
                expect(bound.isValid()).to.be.ok();
                expect(bound.data.field1).to.be(false);
                expect(bound.data.field2).to.be(true);
                expect(bound.data.field3).to.be(true);
                expect(bound.data.field4).to.be(false);
                expect(bound.data.field5).to.be(false);
                done();
            });
        });
    });

    describe('#DateTimeField', function () {
        it('should fail on invalid values', function (done) {
            var form = nw.forms.create({
                field1: nw.forms.DateTimeField({required: false})
            });

            form.handle({
                field1: 'value'
            }, function (bound) {
                expect(bound.isValid()).to.not.be.ok();
                expect(bound.errors).to.have.property('field1');
                done();
            });
        });

        it('should not fail if not required and empty', function (done) {
            var form = nw.forms.create({
                field1: nw.forms.DateTimeField({required: false})
            });

            form.handle({
                field1: ''
            }, function (bound) {
                expect(bound.isValid()).to.be.ok();
                expect(bound.data.field1).to.not.be.ok();
                done();
            });
        });

        it('should parse valid JS Date strings', function (done) {
            var form = nw.forms.create({
                field1: nw.forms.DateTimeField()
            });

            var now = new Date();

            form.handle({
                field1: now.toString()
            }, function (bound) {
                expect(bound.isValid()).to.be.ok();
                expect(bound.data.field1).to.eql(new Date(now.toString()));
                done();
            });
        });
    });
});
