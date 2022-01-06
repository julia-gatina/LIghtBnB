SELECT r.id, p.title, p.cost_per_night, r.start_date, AVG(pr.rating) AS average_rating
FROM properties AS p
JOIN reservations AS r ON p.id = r.property_id
JOIN property_reviews AS pr ON p.id = pr.property_id
WHERE r.guest_id = 1
GROUP BY p.id, r.id
HAVING r.end_date < now()::date
ORDER BY r.start_date
LIMIT 10;