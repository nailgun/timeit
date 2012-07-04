describe('nw.forms', function () {
    describe('#handle()', function () {
        it('should fail if form validator fails', function (done) {
            var form = nw.forms.create({}, function (bound, callback) {
                callback('form error');
            });

            form.handle({}, function (err, bound) {
                expect(err).to.be.ok();
                expect(err).to.have.property('_nonField');
                done();
            });
        });

        it('should success if form validator have successe', function (done) {
            var form = nw.forms.create({}, function (bound, callback) {
                callback();
            });

            form.handle({}, function (err, bound) {
                expect(err).to.not.be.ok();
                done();
            });
        });

        it('should pass bound form to validator and callback', function (done) {
            var value = 'value';

            var form = nw.forms.create({
                field1: nw.forms.StringField()
            }, function (bound, callback) {
                expect(bound.data.field1).to.be(value);
                callback();
            });

            form.handle({
                field1: value
            }, function (err, bound) {
                expect(err).to.not.be.ok();
                expect(bound.data.field1).to.be(value);
                done();
            });
        });

        it('should call parse method of each of its fields', function (done) {
            var valueIn = 'value1';
            var valueOut = 'value2';

            var MockField = function (opt) {
                var field = nw.forms.BaseField(opt);
                field.parse = function (raw_data, callback) {
                    expect(raw_data).to.be(valueIn);
                    callback(null, valueOut);
                };
                return field;
            };

            var form = nw.forms.create({
                field1: MockField()
            });

            form.handle({
                field1: valueIn
            }, function (err, bound) {
                expect(err).to.not.be.ok();
                expect(bound.data.field1).to.be(valueOut);
                done();
            });
        });

        it('should fail if field parser fails', function (done) {
            var MockField = function (opt) {
                var field = nw.forms.BaseField(opt);
                field.parse = function (raw_data, callback) {
                    callback(nw.forms.ValidationError('invalid', field.errorMessages));
                };
                return field;
            };

            var form = nw.forms.create({
                field1: MockField()
            });

            form.handle({
                field1: 'value'
            }, function (err, bound) {
                expect(err).to.be.ok();
                expect(err).to.have.property('field1');
                done();
            });
        });

        it('should fail if field is required and data is missing', function (done) {
            var form = nw.forms.create({
                field1: nw.forms.StringField(),
                field2: nw.forms.StringField()
            });

            form.handle({
                field2: 'value'
            }, function (err, bound) {
                expect(err).to.be.ok();
                expect(err).to.have.property('field1');
                done();
            });
        });

        it('should not fail if field is not required and data is missing', function (done) {
            var form = nw.forms.create({
                field1: nw.forms.StringField({
                    required: false
                })
            });

            form.handle({}, function (err, bound) {
                expect(err).to.not.be.ok();
                done();
            });
        });

        it('should fail if field validator fails', function (done) {
            var form = nw.forms.create({
                field1: nw.forms.StringField({
                    required: false,
                    validators: [function (value, callback) {
                        callback('invalid', 'field is invalid');
                    }]
                })
            });

            form.handle({}, function (err, bound) {
                expect(err).to.be.ok();
                expect(err).to.have.property('field1');
                done();
            });
        });

        it('should not fail if field validator have success', function (done) {
            var form = nw.forms.create({
                field1: nw.forms.StringField({
                    required: false,
                    validators: [function (value, callback) {
                        callback();
                    }]
                })
            });

            form.handle({}, function (err, bound) {
                expect(err).to.not.be.ok();
                done();
            });
        });

        it('should check all fields for errors', function (done) {
            var MockField = function (opt) {
                var field = nw.forms.BaseField(opt);
                field.parse = function (raw_data, callback) {
                    callback(nw.forms.ValidationError('invalid', field.errorMessages));
                };
                return field;
            };

            var form = nw.forms.create({
                field1: MockField(),
                field2: MockField()
            });

            form.handle({
                field1: 'value1',
                field2: 'value2
            }, function (err, bound) {
                expect(err).to.be.ok();
                expect(err).to.have.property('field1');
                expect(err).to.have.property('field2');
                done();
            });
        });

        // TODO: error messages
    });

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
            }, function (err, bound) {
                expect(err).to.not.be.ok();
                expect(bound.data.field1).to.be('value1');
                expect(bound.data.field2).to.be('false');
                expect(bound.data.field3).to.be('0');
                expect(bound.data.field4).to.be('');
                expect(bound.data.field5).to.be('');
                done();
            });
        });

        it('should fail if value is undefined or null', function (done) {
            var form = nw.forms.create({
                field1: nw.forms.StringField(),
                field2: nw.forms.StringField(),
            });

            form.handle({
                field1: null
            }, function (err, bound) {
                expect(err).to.be.ok();
                expect(err).to.have.property('field1');
                expect(err).to.have.property('field2');
                done();
            });
        });
    });
});
