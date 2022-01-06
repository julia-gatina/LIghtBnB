SELECT p.id, p.title, p.cost_per_night, p.city, AVG(pr.rating) AS average_rating 
FROM properties AS p
JOIN property_reviews AS pr ON p.id = pr.property_id
WHERE p.city LIKE '%ancouv%'
GROUP BY p.id, pr.id
HAVING AVG(pr.rating) >= 4
ORDER BY p.cost_per_night
LIMIT 10;