try:
    import ddtrace.sourcecode.setuptools_auto
except ImportError:
    pass

from setuptools import setup, find_packages

setup(
    name="batcoach",
    version="2.0.0",
    description="BatCoach AI Pro: Real-Time Cricket Batting Biomechanics & Stroke Classifier",
    author="Arnavch2024",
    url="https://github.com/Arnavch2024/BattingCoach",
    packages=find_packages(),
    py_modules=["coach_backend", "biomechanics", "run_coach"],
)
