import streamlit as st


st.set_page_config(
        page_title="Summer of Science",
        page_icon="☀️")

st.title('Summer of Science: EXPTECH')

st.header('Toolboxes')
st.page_link('pages/1_🎨_Colour_Converter.py', icon='🎨')
st.page_link('pages/2_🌡️_Black_Body.py', icon='🌡️')
st.page_link('pages/3_👨🏻‍🔬_Einstein_Coefficients.py', icon='👨🏻‍🔬')
st.page_link('pages/4_🔫_Practicum.py', icon='🔫')

st.header('Downloads')
with open("docs/lecture_laser.pdf", "rb") as file:
        laser_pdf = file.read()
with open("docs/recipe_ice_cream.pdf", "rb") as file:
        recipe_pdf = file.read()
st.download_button('🧑‍🏫 Download - Laser Lecture', laser_pdf, 'SoS - Laser Lecture.pdf', mime='application/pdf')
st.download_button('🍦 Download - Ice Cream Recipe', laser_pdf, 'SoS - Ice Cream Recipe.pdf', mime='application/pdf')