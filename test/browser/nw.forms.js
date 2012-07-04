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

        it('should success if field validator have success', function (done) {
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

        it('should call all field validators', function (done) {
            function validator (value, callback) {
                callback();
            }
            var validator1 = sinon.spy(validator),
                validator2 = sinon.spy(validator),
                validator3 = sinon.spy(validator),
                validator4 = sinon.spy(validator);

            var form = nw.forms.create({
                field1: nw.forms.StringField({
                    required: false,
                    validators: [validator1, validator2]
                }),
                field2: nw.forms.StringField({
                    required: false,
                    validators: [validator3, validator4]
                })
            });

            form.handle({}, function (err, bound) {
                expect(err).to.not.be.ok();
                expect(validator1.calledOnce).to.be.ok();
                expect(validator2.calledOnce).to.be.ok();
                expect(validator3.calledOnce).to.be.ok();
                expect(validator4.calledOnce).to.be.ok();
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
                field2: 'value2'
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

        it('should fail if empty and required', function (done) {
            var form = nw.forms.create({
                field1: nw.forms.StringField(),
                field2: nw.forms.StringField(),
                field3: nw.forms.StringField(),
            });

            form.handle({
                field1: null,
                field2: '',
            }, function (err, bound) {
                expect(err).to.be.ok();
                expect(err).to.have.property('field1');
                expect(err).to.have.property('field2');
                expect(err).to.have.property('field3');
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
                field4: nw.forms.NumberField({required: false}),
                field5: nw.forms.NumberField({required: false})
            });

            form.handle({
                field1: 'value',
                field2: '10 value',
                field3: '-+10',
                field4: '10. 10101',
                field5: ''
            }, function (err, bound) {
                expect(err).to.be.ok();
                expect(err).to.have.property('field1');
                expect(err).to.have.property('field2');
                expect(err).to.have.property('field3');
                expect(err).to.have.property('field4');
                expect(err).to.have.property('field5');
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
            }, function (err, bound) {
                expect(err).to.not.be.ok();
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
            }, function (err, bound) {
                expect(err).to.not.be.ok();
                expect(bound.data.field1).to.be(false);
                expect(bound.data.field2).to.be(true);
                expect(bound.data.field3).to.be(true);
                expect(bound.data.field4).to.be(false);
                expect(bound.data.field5).to.be(false);
                done();
            });
        });

        it('should fail if required and false', function (done) {
            var form = nw.forms.create({
                field1: nw.forms.BooleanField()
            });

            form.handle({
                field1: ''
            }, function (err, bound) {
                expect(err).to.be.ok();
                expect(err).to.have.property('field1');
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
            }, function (err, bound) {
                expect(err).to.be.ok();
                expect(err).to.have.property('field1');
                done();
            });
        });

        it('should not fail if not required and empty', function (done) {
            var form = nw.forms.create({
                field1: nw.forms.DateTimeField({required: false})
            });

            form.handle({
                field1: ''
            }, function (err, bound) {
                expect(err).to.be.not.ok();
                expect(bound.data.field1).to.be.not.ok();
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
            }, function (err, bound) {
                expect(err).to.be.not.ok();
                expect(bound.data.field1).to.be(now);
                done();
            });
        });
    });
});
