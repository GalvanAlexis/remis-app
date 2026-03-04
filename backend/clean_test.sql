DELETE FROM ratings WHERE "fromUserId" IN (SELECT id FROM users WHERE username LIKE 'test_%');
DELETE FROM ratings WHERE "toUserId" IN (SELECT id FROM users WHERE username LIKE 'test_%');
DELETE FROM offers WHERE "driverId" IN (SELECT id FROM users WHERE username LIKE 'test_%');
DELETE FROM offers WHERE "rideRequestId" IN (SELECT id FROM ride_requests WHERE "clientId" IN (SELECT id FROM users WHERE username LIKE 'test_%'));
DELETE FROM ride_requests WHERE "clientId" IN (SELECT id FROM users WHERE username LIKE 'test_%');
DELETE FROM driver_documents WHERE "userId" IN (SELECT id FROM users WHERE username LIKE 'test_%');
DELETE FROM profiles WHERE "userId" IN (SELECT id FROM users WHERE username LIKE 'test_%');
DELETE FROM refresh_tokens WHERE "userId" IN (SELECT id FROM users WHERE username LIKE 'test_%');
DELETE FROM users WHERE username LIKE 'test_%';
