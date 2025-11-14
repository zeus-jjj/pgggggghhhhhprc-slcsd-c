# в отдельном потоке закрывает тикеты, которые неактивны продолжительное время
import time
# 
from .modules.database import create_connect
from .modules import logger

def close_tickets():
    db, sql = create_connect()    
    # Сохраняем идентификаторы закрываемых тикетов
    sql.execute("""
        BEGIN;

        WITH closed_tickets AS (
            UPDATE tickets 
            SET status = 'closed' 
            WHERE status <> 'closed' 
            AND id NOT IN (
                SELECT ticket_id 
                FROM (
                    SELECT ticket_id 
                    FROM ticket_messages 
                    GROUP BY ticket_id 
                    HAVING MAX(create_at) >= NOW() - INTERVAL '7 day'
                ) AS recent_tickets
            )
            RETURNING id
        )
        INSERT INTO ticket_messages (ticket_id, text, user_id)
        SELECT id, 'Тикет закрыт автоматически, так как в нём давно не было новых сообщений!' AS text, -1 AS user_id
        FROM closed_tickets;

        COMMIT;
    """)
    db.commit()

def main():
    logger.info(f"[tickets_closer] Поток автозакрытия тикетов запущен успешно!")
    while True:
        try:
            close_tickets()
        except Exception as error:
            logger.error(f"[tickets_closer] Критическая ошибка: {error}")
        finally:
            # ждём
            time.sleep(1800)