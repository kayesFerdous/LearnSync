import logging
import colorlog


async def setup():
    handler = logging.StreamHandler()
    formatter = colorlog.ColoredFormatter(
        "%(log_color)s%(levelname)s - %(name)s - %(message)s",
         log_colors={
             'DEBUG': 'cyan',
             'INFO': 'green',
             'WARNING': 'yellow',
             'ERROR': 'red',
             'CRITICAL': 'black,bg_red',
         }
    )

    handler.setFormatter(formatter)
    logging.root.addHandler(handler)

    #setup the level
    logging.root.setLevel(logging.INFO)

def get_logger(name):
    return logging.getLogger(name)
