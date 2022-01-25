let loop = require( './loop' );

test( 'больше максимума', () => {
  expect( loop( 360.5, 180, 360 ) ).toBe( 180.5 );
  expect( loop( 361, 180, 360 ) ).toBe( 181 );
  expect( loop( 720, 180, 360 ) ).toBe( 180 );
  expect( loop( 721, 180, 360 ) ).toBe( 181 );
});

test( 'рядом с лиминатми', () => {
  expect( loop( 180, 180, 360 ) ).toBe( 180 );
  expect( loop( 190, 180, 360 ) ).toBe( 190 );
  expect( loop( 350, 180, 360 ) ).toBe( 350 );
  expect( loop( 360, 180, 360 ) ).toBe( 180 );
});

test( 'меньше минимума', () => {
  expect( loop( 179.5, 180, 360 ) ).toBe( 359.5 );
  expect( loop( 90, 180, 360 ) ).toBe( 270 );
  expect( loop( 0, 180, 360 ) ).toBe( 180 );
});

test( 'меньше нуля', () => {
  expect( loop( -1, 180, 360 ) ).toBe( 359 );
  expect( loop( -179, 180, 360 ) ).toBe( 181 );
  // expect( loop( -180, 180, 360 ) ).toBe( 180 );
  expect( loop( -181, 180, 360 ) ).toBe( 359 );
});
