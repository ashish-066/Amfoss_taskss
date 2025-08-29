import logging
import os
import asyncio
from dotenv import load_dotenv
from discord.ext import commands
import discord

load_dotenv()
token = os.getenv('DISCORD_TOKEN')

handler = logging.FileHandler(filename='discord.log', encoding='utf-8', mode='w')

intents = discord.Intents.default()
intents.message_content = True
intents.members = True

bot = commands.Bot(command_prefix='!', intents=intents)

words = ["villainous spam", "unauthorized link", "off-topic disruption", "menacing threats"]

@bot.event
async def on_ready():     
    print(f"We are ready to go in, {bot.user.name}")

@bot.event
async def on_member_join(member):
    role = discord.utils.get(member.guild.roles, name="hero")
    if role:
        await member.add_roles(role)

    channel = bot.get_channel(1364656443520978997)  
    if channel:
        await channel.send(f" Welcome {member.mention} to the server!")

@bot.event
async def on_message(message):
    if message.author == bot.user:
        return
    for word in words:
        if word in message.content.lower():
            await message.delete()
            await message.author.send(
                f"Hi {message.author.name}, your message was removed for containing a forbidden word. "
                "Please follow Midtown Tech's code of conduct."
            )

    await bot.process_commands(message)

wisdom_messages = {
    "rules": "**Midtown Tech Core Rules:**\n1. Be respectful.\n2. No spam.\n3. Keep discussions on-topic.",
    "resources": "**Essential Resources:**\n- https://discord.com/developers\n- https://www.linkedin.com/in/karanam-ashish-vardhan-b01362334/",
    "contact": "**Contact Faculty/Admin:**\n- Email: ashishkaranam06@gmail.com\n- Instagram: _ashish_karanam_\n- Phone: 9866651158"
}

@bot.command(name="wisdom")
async def wisdom(ctx, topic: str = None):
    if topic is None:
        await ctx.send("Please provide a topic: `rules`, `resources`, or `contact`.\n")
        return

    topic = topic.lower()
    if topic in wisdom_messages:
        await ctx.send(wisdom_messages[topic])
    else:
        await ctx.send("Unknown topic. Available topics: `rules`, `resources`, `contact`.")

@bot.command(name="announcement")
@commands.has_permissions(administrator=True)  
async def announce(ctx, *, message: str):
    channel = bot.get_channel(1364656994086031451)  
    if channel:
        sent_msg = await channel.send(f"**Announcement:**\n{message}")
        await ctx.send("Announcement sent successfully!")

        async def auto_delete(msg):
            await asyncio.sleep(86400)
            try:
                if not msg.pinned:
                    await msg.delete()
            except discord.NotFound:
                pass  

        bot.loop.create_task(auto_delete(sent_msg))
    else:
        await ctx.send("Announcement channel not found")

bot.run(token, log_handler=handler, log_level=logging.DEBUG)
