import streamlit as st
import numpy as np

st.set_page_config(
        page_title="Summer of Science",
        page_icon="☀️")
st.title("Practicum")
st.info('''A little help for solving the equation of the practicum.''')

# Initialise session state
if 'p-d' not in st.session_state:
    st.session_state['p-d']  = 1.67
    st.session_state['p-d2']  = 1.67
if 'p-L' not in st.session_state:
    st.session_state['p-L'] = 0
    st.session_state['p-L2'] = 0
if 'p-pn' not in st.session_state:
    st.session_state['p-pn'] = 0
    st.session_state['p-pn2'] = 0
if 'p-wavelength' not in st.session_state:
    st.session_state['p-wavelength'] = 0
    st.session_state['p-wavelength2'] = 0
if 'p-n' not in st.session_state:
    st.session_state['p-n'] = 1
    st.session_state['p-n2'] = 1

st.latex(r'''
         \begin{equation}
         p_n=\frac{nL\lambda}{\sqrt{d^2-n^2\lambda^2}}
         \end{equation}''')

with st.expander(r'Solve for $\lambda$'):
    st.latex(r''' 
             \begin{equation*} 
             \lambda = \frac{dp_n}{n\sqrt{L^2+p_n^2}}
             \end{equation*}
             ''')
    def wavelength(session_state):
        teller = session_state['p-d']*1e-3*session_state['p-pn']
        noemer = session_state['p-n'] *np.sqrt(session_state['p-L']**2 + session_state['p-pn']**2)
        return teller/noemer*1e6
    
    col1, col2 = st.columns(2)
    with col1:
        with st.container(border=True):
            st.header('Inputs')
            st.number_input('d (μm)', key='p-d')
            st.number_input('L (mm)', key='p-L')
            st.number_input('$p_n$ (mm)', key='p-pn')
            st.slider('n', min_value=0, max_value=5, key='p-n')
    with col2:
        with st.container(border=True):
            st.header('Output')
            try:
                st.write('$\lambda$ = %d nm' %wavelength(st.session_state))
            except:
                st.write('Error: Probably division by zero')
            
    
with st.expander('Solve for d'):
    st.latex(r''' 
             \begin{equation*} 
             d = \frac{n\lambda}{p_n}\sqrt{L^2+p_n^2}
             \end{equation*}
             ''')
    def d(session_state):
        return session_state['p-n2']*session_state['p-wavelength2']*1e-6 * np.sqrt(session_state['p-L2']**2+session_state['p-pn2']**2)/session_state['p-pn2'] * 1e3
    
    col1, col2 = st.columns(2)
    with col1:
        with st.container(border=True):
            st.header('Inputs')
            st.number_input(r'$\lambda$ (nm)', key='p-wavelength2')
            st.number_input('L (mm)', key='p-L2')
            st.number_input('$p_n$ (mm)', key='p-pn2')
            st.slider('n', min_value=0, max_value=5, key='p-n2')
    with col2:
        with st.container(border=True):
            st.header('Output')
            try:
                st.write('d = %.1f μm' %d(st.session_state))
            except:
                st.write('Error: Probably division by zero')